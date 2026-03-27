# backend/apps/dashboard/views.py

from datetime import timedelta, date as _date

from django.db.models import Avg, Sum, Count
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from core.jwt_utils import jwt_auth

from apps.mood.models import Mood, DailyMoodSummary
from apps.mindfulness.models import (
    MeditationSession,
    UserMeditationStats,
    MindfulnessSession,
)
from apps.counselor.models import Appointment


# -------------------------
# 1. RAW MOOD LOGS (all moods)
# -------------------------
@jwt_auth
def mood_raw(request):
    """
    GET /api/dashboard/mood/raw/?days=30

    Returns all Mood entries for the user (last N days).
    We use mood_score for plotting, and also return mood label so frontend
    can map score -> mood.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        days = int(request.GET.get("days", 30))
    except ValueError:
        days = 30

    user_id = request.user_id
    start_date = timezone.localdate() - timedelta(days=days - 1)

    moods = (
        Mood.objects.filter(user_id=user_id, date__gte=start_date)
        .order_by("created_at")
    )

    data = [
        {
            "id": m.id,
            "date": m.date.isoformat(),
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "mood": m.mood,
            "mood_score": m.mood_score,
            "note": m.note,
        }
        for m in moods
    ]

    return JsonResponse({"moods": data}, status=200)


# -------------------------
# 2. DAILY MOOD SUMMARY (DailyMoodSummary)
# -------------------------
@jwt_auth
def mood_daily(request):
    """
    GET /api/dashboard/mood/daily/?days=30

    Returns DailyMoodSummary entries for the user.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        days = int(request.GET.get("days", 30))
    except ValueError:
        days = 30

    user_id = request.user_id
    start_date = timezone.localdate() - timedelta(days=days - 1)

    summaries = (
        DailyMoodSummary.objects.filter(user_id=user_id, date__gte=start_date)
        .order_by("date")
    )

    data = [
        {
            "date": s.date.isoformat(),
            "avg_score": s.avg_score,
            "dominant_mood": s.dominant_mood,
        }
        for s in summaries
    ]

    return JsonResponse({"summaries": data}, status=200)


# -------------------------
# 3. STREAKS (mood + meditation)
# -------------------------
@jwt_auth
def streaks_summary(request):
    """
    GET /api/dashboard/streaks/

    - mood_current_streak: consecutive days with at least 1 DailyMoodSummary
    - mood_longest_streak: longest such streak
    - meditation streak & totals from UserMeditationStats
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user_id = request.user_id

    # ---- Mood streaks (using DailyMoodSummary presence per day) ----
    summaries = (
        DailyMoodSummary.objects.filter(user_id=user_id)
        .order_by("date")
        .values_list("date", flat=True)
    )

    days_list = sorted(list(set(summaries)))
    day_set = set(days_list)

    longest = 0
    current = 0
    prev = None

    for d in days_list:
        if prev is None or (d - prev).days == 1:
            current += 1
        else:
            longest = max(longest, current)
            current = 1
        prev = d
    longest = max(longest, current)

    # current streak from today backwards
    cur_streak = 0
    t = timezone.localdate()
    while True:
        if t in day_set:
            cur_streak += 1
        else:
            break
        t = t - timedelta(days=1)

    mood_streak = {
        "current_streak": cur_streak,
        "longest_streak": longest,
    }

    # ---- Meditation streak / totals (use precomputed summary) ----
    stats, created = UserMeditationStats.objects.get_or_create(user_id=user_id)

    meditation_data = {
        "current_streak": stats.current_streak,
        "longest_streak": stats.longest_streak,
        "total_minutes": stats.total_minutes,
        "total_sessions": stats.total_sessions,
    }

    return JsonResponse(
        {
            "mood_streak": mood_streak,
            "meditation": meditation_data,
        },
        status=200,
    )


# -------------------------
# 4. SESSIONS SUMMARY (mindfulness + counseling)
# -------------------------
@jwt_auth
def sessions_summary(request):
    """
    GET /api/dashboard/sessions/summary/

    Returns:
    - mindfulness_total_sessions / minutes (completed)
    - meditation_total_sessions / minutes (completed)
    - counseling_sessions_count (appointments)
    - counseling_completed_count
    - counseling_total_minutes (approx using slot start/end)
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user_id = request.user_id

    # ---- Mindfulness sessions ----
    mindfulness_qs = MindfulnessSession.objects.filter(
        user_id=user_id, completed_at__isnull=False
    )

    mindfulness_agg = mindfulness_qs.aggregate(
        total_minutes=Sum("duration_minutes"),
        total_sessions=Count("id"),
    )

    mindfulness_data = {
        "total_sessions": mindfulness_agg["total_sessions"] or 0,
        "total_minutes": mindfulness_agg["total_minutes"] or 0,
    }

    # ---- Meditation sessions ----
    med_qs = MeditationSession.objects.filter(
        user_id=user_id, completed_at__isnull=False
    )

    med_agg = med_qs.aggregate(
        total_minutes=Sum("duration_minutes"),
        total_sessions=Count("id"),
    )

    meditation_data = {
        "total_sessions": med_agg["total_sessions"] or 0,
        "total_minutes": med_agg["total_minutes"] or 0,
    }

    # ---- Counseling appointments ----
    appt_qs = Appointment.objects.filter(student_id=user_id)

    # total count & completed
    total_appts = appt_qs.count()
    completed_appts = appt_qs.filter(status="completed").count()

    # Approx total minutes using slot start/end if available
    total_minutes = 0
    for a in appt_qs.select_related("slot"):
        if a.slot and a.slot.start_time and a.slot.end_time:
            # convert to minutes difference
            delta = (
                _datetime_from_time(a.slot.end_time)
                - _datetime_from_time(a.slot.start_time)
            )
            total_minutes += max(0, int(delta.total_seconds() // 60))
        else:
            # fallback: assume 45 min session if no slot info
            total_minutes += 45

    counseling_data = {
        "total_sessions": total_appts,
        "completed_sessions": completed_appts,
        "total_minutes": total_minutes,
    }

    return JsonResponse(
        {
            "mindfulness": mindfulness_data,
            "meditation": meditation_data,
            "counseling": counseling_data,
        },
        status=200,
    )


# small helper: build datetime from time for duration calc
from datetime import datetime as _dt


def _datetime_from_time(t):
    # use arbitrary same date
    return _dt.combine(_date(2000, 1, 1), t)

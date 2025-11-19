import json
import threading
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Avg, Sum, Count
from datetime import timedelta, date as _date
from django.db.models.functions import TruncDate
from .models import (
    MindfulnessActivity, MindfulnessSession,
    MeditationContent, MeditationSession, UserMeditationStats
)
from apps.mood.models import Mood, DailyMoodSummary  # your existing Mood model
from apps.accounts.models import User
from core.jwt_utils import jwt_auth

# ---------- Activities / Sessions ----------

@jwt_auth
def activities_list(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    qs = MindfulnessActivity.objects.all().order_by("activity_type", "-created_at")
    out = [
        {
            "id": a.id,
            "name": a.name,
            "activity_type": a.activity_type,
            "description": a.description,
            "duration_minutes": a.duration_minutes,
            "video_url": a.video_url,
            "mood_tags": a.tags_list(),
        } for a in qs
    ]
    return JsonResponse({"activities": out}, status=200)


@jwt_auth
def activities_by_mood(request):
    """GET ?mood=happy  -> returns activities tagged for that mood"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    mood = request.GET.get("mood")
    if not mood:
        return JsonResponse({"error": "mood is required"}, status=400)
    qs = MindfulnessActivity.objects.filter(mood_tags__icontains=mood)
    out = [
        {"id": a.id, "name": a.name, "video_url": a.video_url, "duration_minutes": a.duration_minutes, "mood_tags": a.tags_list()}
        for a in qs
    ]
    return JsonResponse({"activities": out}, status=200)


def _map_score_to_mood(score):
    # adjust mapping as you want
    if score <= 1.5: return "angry"
    if score <= 2.5: return "sad"
    if score <= 3.5: return "stressed"
    if score <= 4.5: return "neutral"
    if score <= 5.5: return "calm"
    return "joyful"


@jwt_auth
def recommendations_for_user(request):
    """
    Return 'Sessions for you' based on user's latest daily average mood.
    Logic: get today's avg score for user, convert to mood, return top 5 activities matching that mood.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    user_id = request.user_id
    today = timezone.localdate()
    agg = Mood.objects.filter(user_id=user_id, date=today).aggregate(avg_score=Avg("mood_score"))
    avg = agg.get("avg_score")
    if avg is None:
        # fallback: get latest mood
        last = Mood.objects.filter(user_id=user_id).order_by("-date").first()
        if last:
            mood_key = last.mood
        else:
            mood_key = None
    else:
        mood_key = _map_score_to_mood(avg)

    if mood_key:
        qs = MindfulnessActivity.objects.filter(mood_tags__icontains=mood_key).order_by("-created_at")[:6]
    else:
        qs = MindfulnessActivity.objects.all().order_by("-created_at")[:6]

    out = [
        {"id": a.id, "name": a.name, "video_url": a.video_url, "duration_minutes": a.duration_minutes, "mood_tags": a.tags_list()}
        for a in qs
    ]
    return JsonResponse({"recommended_mood": mood_key, "recommendations": out}, status=200)


@csrf_exempt
@jwt_auth
def start_session(request):
    """POST { activity_id, mood_before (optional) } -> create MindfulnessSession"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    act_id = data.get("activity_id")
    mood_before = data.get("mood_before")
    if not act_id:
        return JsonResponse({"error": "activity_id required"}, status=400)
    try:
        act = MindfulnessActivity.objects.get(pk=act_id)
    except MindfulnessActivity.DoesNotExist:
        return JsonResponse({"error": "Activity not found"}, status=404)

    s = MindfulnessSession.objects.create(user_id=request.user_id, activity=act, mood_before=mood_before)
    return JsonResponse({"message": "Session started", "session": {"id": s.id, "started_at": s.started_at.isoformat()}}, status=201)


@csrf_exempt
@jwt_auth
def complete_session(request):
    """POST { session_id, duration_minutes, mood_after, reflection } -> mark complete"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    sid = data.get("session_id")
    if not sid:
        return JsonResponse({"error": "session_id required"}, status=400)
    try:
        s = MindfulnessSession.objects.get(pk=sid)
    except MindfulnessSession.DoesNotExist:
        return JsonResponse({"error": "Session not found"}, status=404)
    if s.user_id != request.user_id:
        return JsonResponse({"error": "Forbidden"}, status=403)

    s.duration_minutes = int(data.get("duration_minutes", s.duration_minutes or 0))
    s.mood_after = data.get("mood_after", s.mood_after)
    s.reflection = data.get("reflection", s.reflection)
    s.completed_at = timezone.now()
    s.save()

    # Optionally compute effect (you might compare mood_before vs mood_after here)
    return JsonResponse({"message": "Session completed", "session": {"id": s.id, "duration_minutes": s.duration_minutes, "mood_after": s.mood_after}}, status=200)


@jwt_auth
def sessions_list(request):
    """GET -> list user's sessions (optional ?limit=20)"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    limit = int(request.GET.get("limit", 50))
    qs = MindfulnessSession.objects.filter(user_id=request.user_id).order_by("-started_at")[:limit]
    out = [
        {
            "id": s.id,
            "activity": {"id": s.activity.id, "name": s.activity.name} if s.activity else None,
            "started_at": s.started_at.isoformat(),
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "duration_minutes": s.duration_minutes,
            "mood_before": s.mood_before,
            "mood_after": s.mood_after,
            "reflection": s.reflection,
        } for s in qs
    ]
    return JsonResponse({"sessions": out}, status=200)


@jwt_auth
@jwt_auth
def mindfulness_stats(request):
    """
    Return summary: total_sessions, total_minutes, avg_session_duration, last_7_days_count
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    user_id = request.user_id
    
    # Get all completed sessions for the user
    completed_sessions = MindfulnessSession.objects.filter(user_id=user_id, completed_at__isnull=False)
    
    # Perform aggregation on the completed sessions
    agg = completed_sessions.aggregate(
        total_minutes=Sum("duration_minutes"), 
        avg_duration=Avg("duration_minutes")
    )
    
    # Get the total count of sessions
    total_sessions_count = completed_sessions.count()
    
    # Count sessions in the last 7 days
    last_7_days_count = completed_sessions.filter(
        completed_at__gte=timezone.now() - timedelta(days=7)
    ).count()
    
    return JsonResponse({
        "total_sessions": total_sessions_count,
        "total_minutes": int(agg.get("total_minutes") or 0),
        "avg_duration": round(agg.get("avg_duration") or 0, 2),
        "last_7_days": last_7_days_count
    }, status=200)

# ---------- Meditation endpoints (updated) ----------

@jwt_auth
def meditation_list(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    qs = MeditationContent.objects.all().order_by("duration_minutes")
    out = [{"id": m.id, "title": m.title, "duration_minutes": m.duration_minutes, "source_url": m.source_url, "is_audio": m.is_audio} for m in qs]
    return JsonResponse({"meditations": out}, status=200)

@jwt_auth
def daily_mood_summary_list(request):
    """
    GET ?days=7 -> returns list of DailyMoodSummary objects for the user,
    ordered by date descending.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    try:
        days = int(request.GET.get("days", 7))
    except ValueError:
        days = 7
        
    start_date = timezone.localdate() - timedelta(days=days - 1)
    
    qs = DailyMoodSummary.objects.filter(
        user_id=request.user_id,
        date__gte=start_date
    ).order_by('-date')
    
    summaries = [
        {
            "date": s.date,
            "avg_score": s.avg_score,
            "dominant_mood": s.dominant_mood
        } for s in qs
    ]
    
    return JsonResponse({"summaries": summaries}, status=200)



# ---------------------------------------------------------
#  START MEDITATION
# ---------------------------------------------------------
@csrf_exempt
@jwt_auth
def start_meditation(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    meditation_id = data.get("meditation_id")

    meditation_obj = None
    if meditation_id:
        try:
            meditation_obj = MeditationContent.objects.get(pk=meditation_id)
        except MeditationContent.DoesNotExist:
            return JsonResponse({"error": "Meditation not found"}, status=404)

    # Create session
    session = MeditationSession.objects.create(
        user_id=request.user_id,
        meditation=meditation_obj
    )

    return JsonResponse(
        {
            "message": "Meditation started",
            "session": {
                "id": session.id,
                "started_at": session.started_at.isoformat(),
            },
        },
        status=201,
    )


# ---------------------------------------------------------
#  COMPLETE MEDITATION
# ---------------------------------------------------------
@csrf_exempt
@jwt_auth
def complete_meditation(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    session_id = data.get("session_id")
    if not session_id:
        return JsonResponse({"error": "session_id required"}, status=400)

    duration = int(data.get("duration_minutes", 0))
    successful = bool(data.get("successful", True))

    try:
        session = MeditationSession.objects.get(pk=session_id, user_id=request.user_id)
    except MeditationSession.DoesNotExist:
        return JsonResponse({"error": "Session not found or forbidden"}, status=404)

    # Save session
    session.duration_minutes = max(duration, 1)  # enforce min 1 minute
    session.successful = successful
    session.completed_at = timezone.now()
    session.save()

    # Run stats update in background
    threading.Thread(
        target=_update_user_meditation_stats,
        args=[request.user_id],
        daemon=True,
    ).start()

    return JsonResponse(
        {
            "message": "Meditation completed",
            "session": {
                "id": session.id,
                "duration_minutes": session.duration_minutes,
            },
        },
        status=200,
    )


# ---------------------------------------------------------
#  HEATMAP (LAST N DAYS)
# ---------------------------------------------------------
@jwt_auth
def meditation_heatmap(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    days = int(request.GET.get("days", 90))
    end = timezone.localdate()
    start = end - timedelta(days=days - 1)

    qs = (
        MeditationSession.objects.filter(
            user_id=request.user_id,
            completed_at__isnull=False,
            started_at__date__gte=start,
        )
        .annotate(day=TruncDate("started_at"))
        .values("day")
        .annotate(total_minutes=Sum("duration_minutes"))
        .order_by("day")
    )

    heatmap = {str(row["day"]): int(row["total_minutes"] or 0) for row in qs}

    # fill missing days
    result = {}
    d = start
    while d <= end:
        result[str(d)] = heatmap.get(str(d), 0)
        d += timedelta(days=1)

    return JsonResponse(
        {"days": result, "start": str(start), "end": str(end)}, status=200
    )


# ---------------------------------------------------------
#  GET STATS (FAST)
# ---------------------------------------------------------
@jwt_auth
def get_meditation_stats(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    stats, _ = UserMeditationStats.objects.get_or_create(user_id=request.user_id)

    return JsonResponse(
        {
            "current_streak": stats.current_streak,
            "longest_streak": stats.longest_streak,
            "total_minutes": stats.total_minutes,
            "total_sessions": stats.total_sessions,
        },
        status=200,
    )


# ---------------------------------------------------------
#  INTERNAL — UPDATE STREAK & STATS
# ---------------------------------------------------------
def _update_user_meditation_stats(user_id):
    """
    Recalculates streaks, total minutes, and total sessions.
    Runs in background thread.
    """

    # All completed sessions
    qs = (
        MeditationSession.objects.filter(
            user_id=user_id, completed_at__isnull=False
        )
        .annotate(day=TruncDate("started_at"))
        .values("day")
        .annotate(total_minutes=Sum("duration_minutes"))
        .order_by("day")
    )

    # Convert to sorted list of dates
    meditated_days = [str(row["day"]) for row in qs if row["total_minutes"] > 0]
    meditated_days = sorted(meditated_days)

    # ---- LONGEST STREAK ----
    longest = 0
    curr = 0
    prev = None

    for day_str in meditated_days:
        d = _date.fromisoformat(day_str)

        if prev and (d - prev).days == 1:
            curr += 1
        else:
            curr = 1

        longest = max(longest, curr)
        prev = d

    # ---- CURRENT STREAK ----
    today = timezone.localdate()
    current = 0

    while True:
        if str(today) in meditated_days:
            current += 1
            today -= timedelta(days=1)
        else:
            break

    # ---- TOTALS ----
    totals = MeditationSession.objects.filter(
        user_id=user_id, completed_at__isnull=False
    ).aggregate(
        total_minutes=Sum("duration_minutes"),
        total_sessions=Count("id"),
    )

    UserMeditationStats.objects.update_or_create(
        user_id=user_id,
        defaults={
            "current_streak": current,
            "longest_streak": longest,
            "total_minutes": totals["total_minutes"] or 0,
            "total_sessions": totals["total_sessions"] or 0,
        },
    )
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.db.models import Avg, Count
from datetime import date as _date, timedelta
from .models import Mood, DailyMoodSummary
from apps.accounts.models import User
import pytz

# import your jwt decorator (adjust path if needed)
from core.jwt_utils import jwt_auth

# Helper: convert model choices to simple mapping (optional)
MOOD_LABELS = dict(Mood.MOOD_CHOICES)

@csrf_exempt
@jwt_auth
def create_entry(request):
    """
    POST: create mood entry (up to 4/day, must be 6 hours apart)
    Also updates/creates the DailyMoodSummary for that day.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    mood = data.get("mood")
    note = data.get("note", "")
    is_public = data.get("is_public", False)
    date_str = data.get("date")
    date = parse_date(date_str) if date_str else timezone.localdate()

    user_id = request.user_id
    now_utc = timezone.now()
    kolkata_tz = timezone.get_current_timezone()
    now_ist = now_utc.astimezone(kolkata_tz)

    #  limit to 6-hour gap
    last_entry = Mood.objects.filter(user_id=user_id).order_by("-created_at").first()
    if last_entry and (now_utc - last_entry.created_at) < timedelta(hours=6):
        return JsonResponse({"error": "You can only log your mood every 6 hours."}, status=400)

    #  limit to 4 entries/day
    today_count = Mood.objects.filter(user_id=user_id, date=date).count()
    if today_count >= 4:
        return JsonResponse({"error": "You have already logged 4 moods today."}, status=400)

    #  create mood entry
    entry = Mood.objects.create(
        user_id=user_id,
        date=date,
        mood=mood,
        note=note,
        is_public=bool(is_public),
        mood_score=Mood.MOOD_SCORES.get(mood, 3),
        created_at=now_utc
    )

    #  recalculate today’s summary and save
    moods_today = Mood.objects.filter(user_id=user_id, date=date)
    avg_score = moods_today.aggregate(Avg("mood_score"))["mood_score__avg"]
    dominant_mood = (
        moods_today.values("mood")
        .annotate(count=Count("mood"))
        .order_by("-count")
        .first()["mood"]
    )

    DailyMoodSummary.objects.update_or_create(
        user_id=user_id,
        date=date,
        defaults={
            "avg_score": round(avg_score, 2),
            "dominant_mood": dominant_mood,
        },
    )

    return JsonResponse({
        "message": "Mood logged successfully",
        "entry": {
            "id": entry.id,
            "date": str(entry.date),
            "mood": entry.mood,
            "note": entry.note,
            "is_public": entry.is_public,
            "mood_score": entry.mood_score,
        },
        "daily_average": round(avg_score, 2),
        "dominant_mood": dominant_mood,
    }, status=201)

@jwt_auth
def month_calendar(request):
    """
    GET: fetch monthly daily mood summaries (for calendar/dashboard)
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user_id = request.user_id
    month = int(request.GET.get("month", timezone.localdate().month))
    year = int(request.GET.get("year", timezone.localdate().year))

    india_tz = pytz.timezone("Asia/Kolkata")
    now_india = timezone.now().astimezone(india_tz)

    first_day = _date(year, month, 1)
    last_day = _date(year + (month == 12), (month % 12) + 1, 1) - timedelta(days=1)

    summaries = DailyMoodSummary.objects.filter(
        user_id=user_id, date__gte=first_day, date__lte=last_day
    )

    days = {
        str(s.date): {
            "avg_score": s.avg_score,
            "mood": s.dominant_mood,
        }
        for s in summaries
    }

    return JsonResponse({
        "month": month,
        "year": year,
        "days": days,
        "timezone": str(india_tz),
        "generated_at": now_india.strftime("%Y-%m-%d %H:%M:%S"),
    }, status=200)


@jwt_auth
def diary_list(request):
    """
    GET: list user's diary entries with optional search & filters:
        ?q=keyword  -> search in note (own entries)
        ?public_only=true -> only public entries (for counselor view)
        ?start=YYYY-MM-DD&end=YYYY-MM-DD -> date range
    For counsellor viewing other users' public entries, use endpoint below `public_entries_for_user`.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user_id = request.user_id
    q = request.GET.get("q", "").strip()
    public_only = request.GET.get("public_only", "false").lower() == "true"
    start = request.GET.get("start")
    end = request.GET.get("end")

    qs = Mood.objects.filter(user_id=user_id)
    if public_only:
        qs = qs.filter(is_public=True)
    if start:
        qs = qs.filter(date__gte=start)
    if end:
        qs = qs.filter(date__lte=end)
    if q:
        qs = qs.filter(note__icontains=q)

    entries = [
        {
            "id": e.id,
            "date": str(e.date),
            "mood": e.mood,
            "note": e.note,
            "is_public": e.is_public,
            "user_id" : user_id
        }
        for e in qs.order_by("-date")
    ]
    return JsonResponse({"entries": entries}, status=200)

@csrf_exempt
@jwt_auth
def toggle_visibility(request):
    """
    POST: toggle is_public for an existing entry (payload: entry_id, is_public)
    Only the owner can toggle their entry.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    entry_id = data.get("entry_id")
    is_public = data.get("is_public")

    if entry_id is None or is_public is None:
        return JsonResponse({"error": "entry_id and is_public required"}, status=400)

    user_id = request.user_id  # ✅ get from token, not frontend

    try:
        entry = Mood.objects.get(pk=entry_id)
    except Mood.DoesNotExist:
        return JsonResponse({"error": "Entry not found"}, status=404)

    if entry.user_id != user_id:
        return JsonResponse({"error": "Forbidden"}, status=403)

    entry.is_public = bool(is_public)
    entry.save()

    return JsonResponse({
        "message": "Visibility updated",
        "entry": {"id": entry.id, "is_public": entry.is_public}
    }, status=200)


@jwt_auth
def public_entries_for_user(request, target_user_id):
    """
    GET: For counsellor (role check), fetch public entries of a given user (target_user_id)
    Only users with role 'counsellor' can call this endpoint.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # check caller role
    caller = User.objects.get(pk=request.user_id)
    if getattr(caller, "role", "") != "counsellor":
        return JsonResponse({"error": "Forbidden: counsellor role required"}, status=403)

    # optional date filters
    start = request.GET.get("start")
    end = request.GET.get("end")
    qs = Mood.objects.filter(user_id=target_user_id, is_public=True)
    if start:
        qs = qs.filter(date__gte=start)
    if end:
        qs = qs.filter(date__lte=end)

    entries = [
        {"id": e.id, "date": str(e.date), "mood": e.mood, "note": e.note, "is_public": e.is_public}
        for e in qs.order_by("-date")
    ]
    return JsonResponse({"entries": entries}, status=200)


@jwt_auth
def mood_overview(request):
    """
    GET /api/dashboard/mood/

    Returns:
    {
      "all": [
        {
          "id": int,
          "date": "YYYY-MM-DD",
          "created_at": "ISO",
          "mood": "joyful",
          "note": "...",
          "score": 6
        },
        ...
      ],
      "daily": [
        {
          "date": "YYYY-MM-DD",
          "avg_score": float,
          "dominant_mood": "calm"
        },
        ...
      ],
      "stats": {
        "total_mood_entries": int,
        "total_days_logged": int
      }
    }
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user_id = request.user_id

    # ---- All individual mood entries ----
    moods_qs = (
        Mood.objects
        .filter(user_id=user_id)
        .order_by("created_at")
    )

    all_data = [
        {
            "id": m.id,
            "date": m.date.isoformat(),
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "mood": m.mood,
            "note": m.note,
            "score": m.mood_score,
        }
        for m in moods_qs
    ]

    # ---- Daily summary moods ----
    daily_qs = (
        DailyMoodSummary.objects
        .filter(user_id=user_id)
        .order_by("date")
    )

    daily_data = [
        {
            "date": s.date.isoformat(),
            "avg_score": s.avg_score,
            "dominant_mood": s.dominant_mood,
        }
        for s in daily_qs
    ]

    stats = {
        "total_mood_entries": len(all_data),
        "total_days_logged": len(daily_data),
    }

    return JsonResponse(
        {
            "all": all_data,
            "daily": daily_data,
            "stats": stats,
        },
        status=200,
    )
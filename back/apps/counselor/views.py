import json
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from apps.accounts.models import User
from core.jwt_utils import jwt_auth

from .models import (
    CounselorProfile,
    CounselorAvailability,
    Appointment,
    Prescription,
    Message,
    AppointmentFeedback,
)

# -------------------------------------------------------------------
# 1. PUBLIC COUNSELOR LIST (FOR STUDENT SIDE SEARCH & FILTER)
#    URL: GET /counselor/list/?specialization=<code>
# -------------------------------------------------------------------
@jwt_auth
def list_counselors(request):
    """
    Returns list of APPROVED counselors with availability.
    Optional filter: ?specialization=<specialization_code>
    """

    specialization = request.GET.get("specialization")  # optional

    qs = (
        CounselorProfile.objects.filter(
            application_status="APPLIED",
            is_accepted=1,  # approved
        )
        .select_related("user")
        .prefetch_related("availability")
    )

    if specialization:
        qs = qs.filter(specialization=specialization)

    SPECIALIZATION_LABELS = dict(CounselorProfile.SPECIALIZATION_CHOICES)

    counselors_data = []
    for c in qs:
        availability_slots = [
            {
                "id": slot.id,
                "day": slot.day,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "is_active": slot.is_active,
            }
            for slot in c.availability.all().order_by("day", "start_time")
            if slot.is_active
        ]

        counselors_data.append(
            {
                "user_id": c.user.id,
                "profile_id": c.id,
                "name": c.user.username,
                "specialization": c.specialization,
                "specialization_label": SPECIALIZATION_LABELS.get(
                    c.specialization, c.get_specialization_display()
                ),
                "experience": c.experience,
                "bio": c.bio,
                "languages": c.languages,
                "education": c.education,
                "approach": c.approach,
                "availability": availability_slots,
            }
        )

    return JsonResponse({"counselors": counselors_data}, status=200)


# -------------------------------------------------------------------
# 2. BOOK APPOINTMENT (STUDENT)
#    URL: POST /counselor/book-appointment/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def book_appointment(request):
    """
    Body:
    {
      "slot_id": <int>,
      "date": "YYYY-MM-DD"
    }

    - slot_id must be a valid CounselorAvailability ID
    - date must be a real date (student chooses specific day)
    - time auto-filled from slot.start_time
    - prevents double booking same slot+date (except cancelled)
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    slot_id = data.get("slot_id")
    date_str = data.get("date")

    if not slot_id or not date_str:
        return JsonResponse(
            {"error": "slot_id and date are required"},
            status=400,
        )

    # Parse date
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return JsonResponse(
            {"error": "Invalid date format, expected YYYY-MM-DD"},
            status=400,
        )

    # Fetch slot
    try:
        slot = CounselorAvailability.objects.select_related(
            "counselor", "counselor__user"
        ).get(id=slot_id, is_active=True)
    except CounselorAvailability.DoesNotExist:
        return JsonResponse(
            {"error": "Slot not found or inactive"},
            status=404,
        )

    counselor_profile = slot.counselor
    counselor_user = counselor_profile.user

    # Ensure counselor is approved
    if not (
        counselor_profile.application_status == "APPLIED"
        and counselor_profile.is_accepted == 1
    ):
        return JsonResponse(
            {"error": "This counselor is not currently available for booking"},
            status=400,
        )

    # Prevent double booking for same slot+date (except cancelled)
    existing = Appointment.objects.filter(
        slot=slot,
        date=date_obj,
    ).exclude(status="cancelled")

    if existing.exists():
        return JsonResponse(
            {"error": "This slot is already booked for that date"},
            status=400,
        )

    # Create appointment
    appt = Appointment.objects.create(
        student_id=request.user_id,
        counselor=counselor_user,
        slot=slot,
        date=date_obj,
        time=slot.start_time,
        status="pending",
    )

    return JsonResponse(
        {
            "message": "Appointment booked successfully",
            "appointment": {
                "id": appt.id,
                "counselor_name": counselor_user.username,
                "date": appt.date.strftime("%Y-%m-%d"),
                "time": appt.time.strftime("%H:%M"),
                "status": appt.status,
            },
        },
        status=201,
    )


# -------------------------------------------------------------------
# 3. STUDENT – MY APPOINTMENTS
#    URL: GET /counselor/my-appointments/
# -------------------------------------------------------------------
@jwt_auth
def appointment_history(request):
    """
    Returns all appointments (past + future) for logged-in student.

    Each item:
    - id, counselor username
    - date, time, status, meeting_link
    - specialization label
    - has_prescription
    - feedback {rating, comments, created_at} if exists
    - is_past (for UI grouping)
    """

    user_id = request.user_id

    now = timezone.localtime()
    today = now.date()
    current_time = now.time()

    appointments = (
        Appointment.objects.filter(student_id=user_id)
        .select_related("counselor", "slot", "slot__counselor")
        .prefetch_related("prescription_data", "feedback")
        .order_by("-date", "-time")
    )

    SPECIALIZATION_LABELS = dict(CounselorProfile.SPECIALIZATION_CHOICES)

    data = []
    for a in appointments:
        is_past = (a.date < today) or (a.date == today and a.time < current_time)

        specialization_label = None
        if a.slot and hasattr(a.slot, "counselor"):
            counselor_profile = a.slot.counselor
            specialization_label = SPECIALIZATION_LABELS.get(
                counselor_profile.specialization,
                counselor_profile.get_specialization_display(),
            )

        has_prescription = (
            hasattr(a, "prescription_data") and bool(a.prescription_data.notes)
        )

        feedback_obj = getattr(a, "feedback", None)
        feedback_data = None
        if feedback_obj:
            feedback_data = {
                "rating": feedback_obj.rating,
                "comments": feedback_obj.comments,
                "created_at": feedback_obj.created_at.isoformat(),
            }

        data.append(
            {
                "id": a.id,
                "counselor": a.counselor.username if a.counselor else None,
                "date": a.date.strftime("%Y-%m-%d"),
                "time": a.time.strftime("%H:%M"),
                "status": a.status,
                "meeting_link": a.meeting_link,
                "specialization": specialization_label,
                "has_prescription": has_prescription,
                "feedback": feedback_data,
                "is_past": is_past,
            }
        )

    return JsonResponse({"appointments": data}, status=200)


# -------------------------------------------------------------------
# 4. STUDENT – VIEW PRESCRIPTION
#    URL: GET /counselor/appointments/<appointment_id>/prescription/
# -------------------------------------------------------------------
@jwt_auth
def get_prescription(request, appointment_id):
    """
    Student can view prescription for a specific appointment.
    """
    try:
        # Ensure appointment belongs to this student
        appt = Appointment.objects.get(id=appointment_id, student_id=request.user_id)
    except Appointment.DoesNotExist:
        return JsonResponse({"error": "Appointment not found"}, status=404)

    try:
        pres = Prescription.objects.get(appointment=appt)
        return JsonResponse(
            {
                "notes": pres.notes,
                "date": pres.created_at.strftime("%Y-%m-%d %H:%M"),
            },
            status=200,
        )
    except Prescription.DoesNotExist:
        return JsonResponse({"notes": ""}, status=200)


# -------------------------------------------------------------------
# 5. APPOINTMENT FEEDBACK (STUDENT → COUNSELOR)
#    URL: GET/POST /counselor/appointments/<appointment_id>/feedback/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def appointment_feedback(request, appointment_id):
    """
    - GET: fetch feedback for this appointment (if any)
    - POST/PUT: create or update feedback

    Body:
    {
      "rating": 1-5,
      "comments": "optional text"
    }
    """

    # Ensure appointment belongs to this student
    try:
        appt = Appointment.objects.get(id=appointment_id, student_id=request.user_id)
    except Appointment.DoesNotExist:
        return JsonResponse({"error": "Appointment not found"}, status=404)

    if request.method == "GET":
        fb = getattr(appt, "feedback", None)
        if not fb:
            return JsonResponse({"feedback": None}, status=200)

        return JsonResponse(
            {
                "feedback": {
                    "rating": fb.rating,
                    "comments": fb.comments,
                    "created_at": fb.created_at.isoformat(),
                    "updated_at": fb.updated_at.isoformat(),
                }
            },
            status=200,
        )

    if request.method not in ["POST", "PUT"]:
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    rating = data.get("rating")
    comments = data.get("comments", "")

    if not isinstance(rating, int) or rating < 1 or rating > 5:
        return JsonResponse(
            {"error": "Rating must be an integer between 1 and 5"},
            status=400,
        )

    fb, created = AppointmentFeedback.objects.get_or_create(
        appointment=appt,
        defaults={"rating": rating, "comments": comments},
    )

    if not created:
        fb.rating = rating
        fb.comments = comments
        fb.save()

    return JsonResponse(
        {
            "message": "Feedback saved",
            "feedback": {
                "rating": fb.rating,
                "comments": fb.comments,
            },
        },
        status=200,
    )


# -------------------------------------------------------------------
# 6. APPLY / REAPPLY AS COUNSELOR
#    URL: POST /counselor/apply/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def apply_for_counselor(request):
    """
    POST body:
    {
      "specialization": "...",
      "experience": 2,
      "qualifications": "...",
      "languages": "...",
      "bio": "...",
      "education": "...",
      "approach": "...",
      "motivation": "..."
    }

    - If profile doesn't exist → create new with APPLIED + is_accepted=0
    - If exists → update fields and reset is_accepted=0 (pending again)
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    user = User.objects.get(id=request.user_id)

    profile, created = CounselorProfile.objects.get_or_create(
        user=user,
        defaults={
            "specialization": data.get("specialization", ""),
            "experience": data.get("experience", 0),
            "qualifications": data.get("qualifications", ""),
            "languages": data.get("languages", ""),
            "bio": data.get("bio", ""),
            "education": data.get("education", ""),
            "approach": data.get("approach", ""),
            "motivation": data.get("motivation", ""),
            "application_status": "APPLIED",
            "is_accepted": 0,  # pending
        },
    )

    if not created:
        # Update existing profile / re-apply
        profile.specialization = data.get("specialization", profile.specialization)
        profile.experience = data.get("experience", profile.experience)
        profile.qualifications = data.get("qualifications", profile.qualifications)
        profile.languages = data.get("languages", profile.languages)
        profile.bio = data.get("bio", profile.bio)
        profile.education = data.get("education", profile.education)
        profile.approach = data.get("approach", profile.approach)
        profile.motivation = data.get("motivation", profile.motivation)

        profile.application_status = "APPLIED"
        profile.is_accepted = 0  # back to pending
        profile.save()

    return JsonResponse(
        {
            "message": "Application submitted",
            "status": "PENDING",
        },
        status=201,
    )


# -------------------------------------------------------------------
# 7. GET COUNSELOR PROFILE (SELF)
#    URLS:
#      - GET /counselor/portfolio/
#      - GET /counselor/counselor/profile/me/
#   (both mapped to this)
# -------------------------------------------------------------------
@jwt_auth
def get_counselor_profile(request):
    try:
        user = User.objects.get(id=request.user_id)
        profile = user.counselor_profile
    except CounselorProfile.DoesNotExist:
        return JsonResponse({"error": "No counselor profile found"}, status=404)

    data = {
        "specialization": profile.specialization,
        "experience": profile.experience,
        "qualifications": profile.qualifications,
        "languages": profile.languages,
        "bio": profile.bio,
        "education": profile.education,
        "approach": profile.approach,
        "motivation": profile.motivation,
        "is_approved": profile.is_accepted,  # 0/1/2
    }
    return JsonResponse(data, status=200)


# -------------------------------------------------------------------
# 8. UPDATE COUNSELOR PROFILE
#    URL: POST/PUT /counselor/counselor/profile/update/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def update_counselor_profile(request):
    if request.method not in ["POST", "PUT"]:
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    user = User.objects.get(id=request.user_id)

    profile, _ = CounselorProfile.objects.get_or_create(user=user)

    # Update fields user is allowed to edit
    for field in [
        "specialization",
        "experience",
        "qualifications",
        "languages",
        "bio",
        "education",
        "approach",
        "motivation",
    ]:
        if field in data:
            setattr(profile, field, data[field])

    profile.save()

    return JsonResponse({"message": "Profile updated successfully"}, status=200)


# -------------------------------------------------------------------
# 9. COUNSELOR – SEE THEIR SESSIONS (APPOINTMENTS)
#    URL: GET /counselor/my-sessions/
# -------------------------------------------------------------------
@jwt_auth
def counselor_sessions(request):
    """
    For counselor to see all upcoming + past appointments.
    Uses Appointment model, not a separate CounselorSession.
    """

    counselor_id = request.user_id

    now = timezone.localtime()
    today = now.date()
    current_time = now.time()

    appointments = (
        Appointment.objects.filter(counselor_id=counselor_id)
        .select_related("student", "slot")
        .prefetch_related("prescription_data")
        .order_by("date", "time")
    )

    data = []
    for a in appointments:
        is_past = (a.date < today) or (a.date == today and a.time < current_time)
        has_prescription = (
            hasattr(a, "prescription_data") and bool(a.prescription_data.notes)
        )

        data.append(
            {
                "id": a.id,
                "student": a.student.username if a.student else None,
                "date": a.date.strftime("%Y-%m-%d"),
                "time": a.time.strftime("%H:%M"),
                "status": a.status,
                "slot_day": a.slot.day if a.slot else None,
                "slot_range": (
                    f"{a.slot.start_time.strftime('%H:%M')}–{a.slot.end_time.strftime('%H:%M')}"
                    if a.slot
                    else None
                ),
                "has_prescription": has_prescription,
                "is_past": is_past,
            }
        )

    return JsonResponse({"sessions": data}, status=200)


# -------------------------------------------------------------------
# 10. COUNSELOR – SAVE / EDIT PRESCRIPTION
#     URL: POST /counselor/session/<appointment_id>/prescription/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def save_prescription(request, appointment_id):
    """
    Counselor adds or updates prescription for a given appointment.

    Body: { "notes": "..." }
    """
    try:
        appointment = Appointment.objects.get(
            id=appointment_id, counselor_id=request.user_id
        )
    except Appointment.DoesNotExist:
        return JsonResponse({"error": "Appointment not found"}, status=404)

    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    notes = data.get("notes", "")

    pres, created = Prescription.objects.get_or_create(
        appointment=appointment,
        defaults={"notes": notes},
    )

    if not created:
        pres.notes = notes
        pres.save()

    return JsonResponse({"message": "Prescription saved successfully"}, status=200)


# -------------------------------------------------------------------
# 11. SIMPLE APPROVED CHECK (LEGACY SUPPORT)
#     URL: POST /counselor/is_approved/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def check_counselor_status(request):
    """
    Old API used in earlier Sidebar version.
    We'll keep it:
      - exists: whether CounselorProfile exists
      - is_approved: True if is_accepted == 1
    """
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    user = User.objects.get(id=request.user_id)

    if hasattr(user, "counselor_profile"):
        profile = user.counselor_profile
        return JsonResponse(
            {
                "exists": True,
                "is_approved": profile.is_accepted == 1,
            },
            status=200,
        )

    return JsonResponse({"exists": False, "is_approved": False}, status=200)


# -------------------------------------------------------------------
# 12. APPLICATION STATUS (USED BY PORTAL + SIDEBAR)
#     URL: POST /counselor/application-status/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def get_counselor_application_status(request):
    """
    Returns:
    {
      "status": "NOT_APPLIED" | "PENDING" | "APPROVED" | "REJECTED",
      "is_applied": bool,
      "is_accepted": 0|1|2,
      "profile": {...} or None
    }

    Mapping:
      - no profile                  => NOT_APPLIED, is_applied=False, is_accepted=0
      - application_status=APPLIED, is_accepted=0 => PENDING
      - application_status=APPLIED, is_accepted=1 => APPROVED
      - application_status=APPLIED, is_accepted=2 => REJECTED
    """
    user = User.objects.get(id=request.user_id)

    # 1. No profile → Not applied
    if not hasattr(user, "counselor_profile"):
        return JsonResponse(
            {
                "status": "NOT_APPLIED",
                "is_applied": False,
                "is_accepted": 0,
                "profile": None,
            },
            status=200,
        )

    profile = user.counselor_profile

    # if somehow application_status not APPLIED, treat as not applied
    if profile.application_status != "APPLIED":
        return JsonResponse(
            {
                "status": "NOT_APPLIED",
                "is_applied": False,
                "is_accepted": 0,
                "profile": None,
            },
            status=200,
        )

    # Now we know: APPLIED
    is_applied = True
    is_accepted = profile.is_accepted

    if is_accepted == 0:
        status = "PENDING"
    elif is_accepted == 1:
        status = "APPROVED"
    elif is_accepted == 2:
        status = "REJECTED"
    else:
        status = "PENDING"

    profile_data = {
        "specialization": profile.specialization,
        "experience": profile.experience,
        "bio": profile.bio,
    }

    return JsonResponse(
        {
            "status": status,
            "is_applied": is_applied,
            "is_accepted": is_accepted,
            "profile": profile_data,
        },
        status=200,
    )


# -------------------------------------------------------------------
# 13. COUNSELOR AVAILABILITY LIST / CREATE
#     URL: GET/POST /counselor/availability/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def counselor_availability_list(request):
    """
    GET  -> list all availability slots for logged-in counselor
    POST -> create one or multiple availability slots

    POST accepts:
      - single object  {day, start_time, end_time, is_active?}
      - OR list of such objects
    """
    user = User.objects.get(id=request.user_id)

    if not hasattr(user, "counselor_profile"):
        return JsonResponse(
            {"error": "Counselor profile not found"},
            status=400,
        )

    counselor = user.counselor_profile

    # -------- GET LIST --------
    if request.method == "GET":
        slots = CounselorAvailability.objects.filter(counselor=counselor).order_by(
            "day", "start_time"
        )

        data = [
            {
                "id": slot.id,
                "day": slot.day,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "is_active": slot.is_active,
            }
            for slot in slots
        ]

        return JsonResponse({"availability": data}, status=200)

    # -------- CREATE (POST) --------
    if request.method == "POST":
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        # Support both single object and list
        if isinstance(body, dict):
            slots_payload = [body]
        else:
            slots_payload = body

        created_slots = []

        for item in slots_payload:
            day = item.get("day")
            start_time_str = item.get("start_time")
            end_time_str = item.get("end_time")

            if not day or not start_time_str or not end_time_str:
                return JsonResponse(
                    {"error": "day, start_time and end_time are required"},
                    status=400,
                )

            try:
                start_time = datetime.strptime(start_time_str, "%H:%M").time()
                end_time = datetime.strptime(end_time_str, "%H:%M").time()
            except ValueError:
                return JsonResponse(
                    {"error": "Invalid time format, expected HH:MM"},
                    status=400,
                )

            if start_time >= end_time:
                return JsonResponse(
                    {"error": "start_time must be before end_time"},
                    status=400,
                )

            slot, created = CounselorAvailability.objects.get_or_create(
                counselor=counselor,
                day=day,
                start_time=start_time,
                end_time=end_time,
                defaults={"is_active": item.get("is_active", True)},
            )

            created_slots.append(
                {
                    "id": slot.id,
                    "day": slot.day,
                    "start_time": slot.start_time.strftime("%H:%M"),
                    "end_time": slot.end_time.strftime("%H:%M"),
                    "is_active": slot.is_active,
                }
            )

        return JsonResponse(
            {"message": "Availability saved", "slots": created_slots},
            status=201,
        )

    return JsonResponse({"error": "Invalid method"}, status=405)


# -------------------------------------------------------------------
# 14. COUNSELOR AVAILABILITY DETAIL (UPDATE / DELETE)
#     URL: PUT/PATCH/DELETE /counselor/availability/<slot_id>/
# -------------------------------------------------------------------
@csrf_exempt
@jwt_auth
def counselor_availability_detail(request, slot_id):
    user = User.objects.get(id=request.user_id)

    if not hasattr(user, "counselor_profile"):
        return JsonResponse(
            {"error": "Counselor profile not found"},
            status=400,
        )

    counselor = user.counselor_profile

    try:
        slot = CounselorAvailability.objects.get(id=slot_id, counselor=counselor)
    except CounselorAvailability.DoesNotExist:
        return JsonResponse({"error": "Slot not found"}, status=404)

    # ---------- UPDATE ----------
    if request.method in ["PUT", "PATCH"]:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        day = data.get("day", slot.day)
        start_time_str = data.get("start_time")
        end_time_str = data.get("end_time")
        is_active = data.get("is_active", slot.is_active)

        if start_time_str:
            try:
                start_time = datetime.strptime(start_time_str, "%H:%M").time()
            except ValueError:
                return JsonResponse(
                    {"error": "Invalid start_time format, expected HH:MM"},
                    status=400,
                )
        else:
            start_time = slot.start_time

        if end_time_str:
            try:
                end_time = datetime.strptime(end_time_str, "%H:%M").time()
            except ValueError:
                return JsonResponse(
                    {"error": "Invalid end_time format, expected HH:MM"},
                    status=400,
                )
        else:
            end_time = slot.end_time

        if start_time >= end_time:
            return JsonResponse(
                {"error": "start_time must be before end_time"},
                status=400,
            )

        slot.day = day
        slot.start_time = start_time
        slot.end_time = end_time
        slot.is_active = is_active
        slot.save()

        return JsonResponse(
            {
                "message": "Slot updated",
                "slot": {
                    "id": slot.id,
                    "day": slot.day,
                    "start_time": slot.start_time.strftime("%H:%M"),
                    "end_time": slot.end_time.strftime("%H:%M"),
                    "is_active": slot.is_active,
                },
            },
            status=200,
        )

    # ---------- DELETE ----------
    if request.method == "DELETE":
        slot.delete()
        return JsonResponse({"message": "Slot deleted"}, status=200)

    return JsonResponse({"error": "Invalid method"}, status=405)


@jwt_auth
def counselor_dashboard(request):
    """
    GET /counselor/dashboard/

    Returns:
    - profile
    - sessions list
    - feedback list
    - stats (average rating, total sessions, total feedback, unique students)
    """

    try:
        user = User.objects.get(id=request.user_id)
        profile = user.counselor_profile
    except CounselorProfile.DoesNotExist:
        return JsonResponse({"error": "Counselor profile not found"}, status=404)

    # -----------------------------------
    # 1. PROFILE DATA
    # -----------------------------------
    profile_data = {
        "username": user.username,
        "full_name": user.full_name if hasattr(user, "full_name") else "",
        "specialization": profile.specialization,
        "experience": profile.experience,
        "bio": profile.bio,
        "languages": profile.languages,
        "education": profile.education,
        "approach": profile.approach,
        "motivation": profile.motivation,
    }

    # -----------------------------------
    # 2. SESSIONS FOR COUNSELOR
    # -----------------------------------
    appointments = (
        Appointment.objects
        .filter(counselor_id=user.id)
        .select_related("student", "slot")
        .order_by("-date", "-time")
    )

    sessions_data = []
    student_ids = set()

    for a in appointments:
        student_ids.add(a.student_id)

        sessions_data.append({
            "id": a.id,
            "student": a.student.username,
            "student_name": a.student.username,
            "date": a.date.strftime("%Y-%m-%d"),
            "time": a.time.strftime("%H:%M"),
            "status": a.status,
            "has_prescription": hasattr(a, "prescription_data"),
        })

    # -----------------------------------
    # 3. FEEDBACK LIST
    # -----------------------------------
    feedback_qs = AppointmentFeedback.objects.filter(
        appointment__counselor_id=user.id
    ).select_related("appointment__student")

    feedback_data = [
        {
            "id": fb.id,
            "appointment_id": fb.appointment_id,
            "student_name": fb.appointment.student.username,
            "rating": fb.rating,
            "comments": fb.comments,
            "created_at": fb.created_at.strftime("%Y-%m-%d %H:%M"),
        }
        for fb in feedback_qs
    ]

    # -----------------------------------
    # 4. STATS
    # -----------------------------------
    total_feedback_count = feedback_qs.count()
    total_sessions = appointments.count()

    if total_feedback_count > 0:
        total_rating = sum(fb.rating for fb in feedback_qs)
        average_rating = round(total_rating / total_feedback_count, 2)
    else:
        average_rating = None

    stats_data = {
        "total_sessions": total_sessions,
        "unique_students": len(student_ids),
        "average_rating": average_rating,
        "total_feedback_count": total_feedback_count,
    }

    # -----------------------------------
    # RESPONSE
    # -----------------------------------
    return JsonResponse({
        "profile": profile_data,
        "sessions": sessions_data,
        "feedback": feedback_data,
        "stats": stats_data,
    }, status=200)

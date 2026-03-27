from django.db import models
from django.utils import timezone
from apps.accounts.models import User


# ---------------------------------------------------------
# 1️⃣ MAIN COUNSELOR PROFILE (User → Counselor Data)
# ---------------------------------------------------------

class CounselorProfile(models.Model):

    APPLICATION_STATUS = [
        ("NOT_APPLIED", "Not Applied"),
        ("APPLIED", "Applied"),
    ]

    SPECIALIZATION_CHOICES = [
        ("academic_stress", "Academic Stress"),
        ("anxiety_stress", "Anxiety & Stress Management"),
        ("depression", "Depression Support"),
        ("career_guidance", "Career & Academic Guidance"),
        ("relationship_issues", "Relationship Issues"),
        ("self_esteem", "Self-esteem & Confidence"),
        ("time_management", "Time Management & Productivity"),
        ("behavioral_issues", "Behavioral Issues"),
        ("family_issues", "Family Issues"),
        ("grief_support", "Grief & Emotional Healing"),
        ("trauma_support", "Trauma Support"),
        ("mindfulness", "Mindfulness & Well-being"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="counselor_profile"
    )

    specialization = models.CharField(max_length=50, choices=SPECIALIZATION_CHOICES)
    experience = models.PositiveIntegerField(default=0)
    qualifications = models.TextField(blank=True, default="")
    languages = models.CharField(max_length=200, blank=True, default="")
    bio = models.TextField(blank=True, default="")

    education = models.CharField(max_length=255, blank=True, default="")
    approach = models.CharField(max_length=255, blank=True, default="")
    motivation = models.TextField(blank=True, default="")

    # application_status: NOT_APPLIED / APPLIED
    application_status = models.CharField(
        max_length=20, choices=APPLICATION_STATUS, default="NOT_APPLIED"
    )

    # is_accepted: 0 = pending, 1 = accepted, 2 = rejected
    is_accepted = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} ({self.application_status}, {self.is_accepted})"



# ---------------------------------------------------------
# 2️⃣ COUNSELOR AVAILABILITY (Daywise time ranges)
# ---------------------------------------------------------

class CounselorAvailability(models.Model):
    counselor = models.ForeignKey(
        CounselorProfile,
        on_delete=models.CASCADE,
        related_name="availability"
    )

    DAY_CHOICES = [
        ("monday", "Monday"),
        ("tuesday", "Tuesday"),
        ("wednesday", "Wednesday"),
        ("thursday", "Thursday"),
        ("friday", "Friday"),
        ("saturday", "Saturday"),
        ("sunday", "Sunday"),
    ]

    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["day", "start_time"]
        unique_together = ("counselor", "day", "start_time", "end_time")

    def __str__(self):
        return f"{self.counselor.user.username}: {self.day} {self.start_time}-{self.end_time}"



# ---------------------------------------------------------
# 3️⃣ APPOINTMENTS (Student books a counselor)
# ---------------------------------------------------------

class Appointment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("applied", "Applied"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="student_appointments"
    )
    counselor = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="counselor_appointments"
    )

    slot = models.ForeignKey(
        CounselorAvailability,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )

    date = models.DateField()
    time = models.TimeField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    meeting_link = models.URLField(blank=True, null=True)
    cancel_reason = models.TextField(blank=True, default="")
    
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.student.username} → {self.counselor.username} ({self.date} {self.time})"


# ---------------------------------------------------------
# 4️⃣ PRESCRIPTION (One per appointment)
# ---------------------------------------------------------

class Prescription(models.Model):
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name="prescription_data"
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Prescription for appointment {self.appointment.id}"


# ---------------------------------------------------------
# 5️⃣ CHAT MESSAGES (Within an appointment)
# ---------------------------------------------------------

class Message(models.Model):
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()

    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"

# ---------------------------------------------------------
# 6 APPOINTMENT FEEDBACK (Student → counselor feedback)
# ---------------------------------------------------------

class AppointmentFeedback(models.Model):
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name="feedback",
    )
    rating = models.PositiveSmallIntegerField(default=5)  # 1–5
    comments = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback for appointment {self.appointment.id} ({self.rating}/5)"

from django.db import models
from django.utils import timezone
from apps.accounts.models import User

class MindfulnessActivity(models.Model):
    """
    Activities for sessions (NOT meditations). Each activity is linked to one or more moods
    via comma-separated tags in `mood_tags` (e.g. 'sad,stressed').
    """
    ACTIVITY_TYPES = [
        ("session_mood", "Session for Mood"),
        ("breathing", "Breathing"),
        ("body_scan", "Body Scan"),
        ("gratitude", "Gratitude Journal"),
        ("visualization", "Visualization"),
        ("meditation", "Meditation"),  # keep as a category but meditations stored separately too
    ]

    name = models.CharField(max_length=200)
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES, default="session_mood")
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=10)
    video_url = models.URLField(blank=True, null=True)   # keep only video_url as requested
    mood_tags = models.CharField(max_length=200, blank=True, help_text="comma separated mood tags, e.g. 'sad,stressed'")
    created_at = models.DateTimeField(auto_now_add=True)

    def tags_list(self):
        return [t.strip() for t in (self.mood_tags or "").split(",") if t.strip()]

    def __str__(self):
        return self.name


class MindfulnessSession(models.Model):
    """Tracks each session attendance (for sessions -> not meditation)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity = models.ForeignKey(MindfulnessActivity, on_delete=models.SET_NULL, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    duration_minutes = models.PositiveSmallIntegerField(default=0)
    mood_before = models.CharField(max_length=32, blank=True, null=True)
    mood_after = models.CharField(max_length=32, blank=True, null=True)
    reflection = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-started_at",)

    def __str__(self):
        return f"{self.user.username} | {self.activity and self.activity.name} | {self.started_at.date()}"


class MeditationContent(models.Model):
    """Meditation audio/video assets (separate library). We'll store audios here too (source_url)."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=5)
    source_url = models.URLField(blank=True, null=True)  # youtube link or hosted audio
    is_audio = models.BooleanField(default=True)         # true for audio assets
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.duration_minutes}m)"


class MeditationSession(models.Model):
    """Separate meditation session tracking for heatmap & streaks."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    meditation = models.ForeignKey(MeditationContent, on_delete=models.SET_NULL, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(default=0)  # exact elapsed seconds
    duration_minutes = models.PositiveSmallIntegerField(default=0)  # derived, used for aggregation
    successful = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class UserMeditationStats(models.Model):
    """
    This is the SUMMARY table. One row per user.
    It stores the pre-calculated results for fast loading.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    total_minutes = models.PositiveIntegerField(default=0)
    total_sessions = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveSmallIntegerField(default=0)
    longest_streak = models.PositiveSmallIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.user.username} - {self.total_minutes} mins"

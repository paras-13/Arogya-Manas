# apps/mood/models.py
from django.db import models
from django.utils import timezone
from apps.accounts.models import User

class Mood(models.Model):

    MOOD_CHOICES = [
    ('angry', 'Angry'),
    ('sad', 'Sad'),
    ('stressed', 'Stressed'),
    ('neutral', 'Neutral'),
    ('calm', 'Calm'),
    ('joyful', 'Joyful'),
    ]

    MOOD_SCORES = {
        'angry' : 1,
        'sad': 2,
        'stressed': 3, 
        'neutral': 4,
        'calm': 5,
        'joyful': 6,
    }
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.localdate)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    note = models.TextField(default="")
    is_public = models.BooleanField(default=False)
    mood_score = models.PositiveSmallIntegerField(default=3)
    created_at = models.DateTimeField()

class DailyMoodSummary(models.Model):
    MOOD_CHOICES = [
    ('angry', 'Angry'),
    ('sad', 'Sad'),
    ('stressed', 'Stressed'),
    ('neutral', 'Neutral'),
    ('calm', 'Calm'),
    ('joyful', 'Joyful'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    avg_score = models.FloatField(default=3.0)
    
    dominant_mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "date")

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.dominant_mood}"
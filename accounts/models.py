from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone


class User(models.Model):
    """Simple user model (no AbstractUser).

    This model stores an explicit `password` field (hashed). We provide
    `set_password` and `check_password` helpers that wrap Django's
    hashing utilities so the rest of the code can remain unchanged.
    """
    ROLE_CHOICES = (
        ('user', 'User'),
        ('counsellor', 'Counsellor'),
        ('admin', 'Admin'),
    )

    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    date_joined = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.username} ({self.role})"

    def set_password(self, raw_password):
        """Hash and set the user's password."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Return True if the given raw_password matches the stored hash."""
        return check_password(raw_password, self.password)

from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

class User(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('counsellor', 'Counsellor'),
        ('admin', 'Admin'),
    )

    username = models.CharField(max_length=150, unique=True)
    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    date_joined = models.DateTimeField(default=timezone.now)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username

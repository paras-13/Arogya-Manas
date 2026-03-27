# backend/apps/dashboard/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path("mood/raw/", views.mood_raw, name="dashboard-mood-raw"),
    path("mood/daily/", views.mood_daily, name="dashboard-mood-daily"),
    path("streaks/", views.streaks_summary, name="dashboard-streaks"),
    path(
        "sessions/summary/",
        views.sessions_summary,
        name="dashboard-sessions-summary",
    ),
]

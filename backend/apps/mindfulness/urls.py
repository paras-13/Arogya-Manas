from django.urls import path
from . import views

urlpatterns = [
    # Sessions / activities
    path("activities/", views.activities_list, name="mindfulness-activities"),
    path("activities/by-mood/", views.activities_by_mood, name="mindfulness-activities-by-mood"),
    path("recommendations/", views.recommendations_for_user, name="mindfulness-recommendations"),  # Sessions for you
    path("sessions/start/", views.start_session, name="mindfulness-session-start"),
    path("sessions/complete/", views.complete_session, name="mindfulness-session-complete"),
    path("sessions/", views.sessions_list, name="mindfulness-sessions-list"),
    path("stats/", views.mindfulness_stats, name="mindfulness-stats"),
    path('mood-summary/', views.daily_mood_summary_list, name='daily_mood_summary_list'),
    # Meditation
    path("meditations/", views.meditation_list, name="meditation-list"),
    path("meditations/start/", views.start_meditation, name="meditation-start"),
    path("meditations/complete/", views.complete_meditation, name="meditation-complete"),
    path("meditations/heatmap/", views.meditation_heatmap, name="meditation-heatmap"),
    path("meditations/stats/", views.get_meditation_stats, name="get-meditation-stats"),
]

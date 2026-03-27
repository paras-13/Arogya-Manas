from django.urls import path
from . import views

urlpatterns = [
     path("mood/", views.mood_overview, name="dashboard-mood"),
    path("entries/create/", views.create_entry, name="mood-create"),
    path("calendar/", views.month_calendar, name="mood-calendar"),
    path("diary/", views.diary_list, name="mood-diary"),
    path("diary/toggle/", views.toggle_visibility, name="mood-toggle"),
    path("public/<int:target_user_id>/", views.public_entries_for_user, name="mood-public-for-user"),
]

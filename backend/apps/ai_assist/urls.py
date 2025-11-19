from django.urls import path
from . import views

urlpatterns = [
    path("history/", views.chat_history),
    path("chat/", views.chat_api),
    path("end/", views.end_chat),
    path("reports/", views.session_reports),
    path('rename/<int:report_id>/', views.rename_session),
]

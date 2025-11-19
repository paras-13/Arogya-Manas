from django.urls import path
from . import views

urlpatterns = [
    path("list/", views.list_counselors),
    path('dashboard-data/', views.counselor_dashboard),
    path("book-appointment/", views.book_appointment),
    path("my-appointments/", views.appointment_history),
    path("appointments/<int:appointment_id>/prescription/", views.get_prescription, name="get_prescription"),
    path("appointments/<int:appointment_id>/feedback/", views.appointment_feedback, name="appointment_feedback"),


    ## FOr Counselor
    path("apply/", views.apply_for_counselor),
    path("portfolio/", views.get_counselor_profile),
    path("my-sessions/", views.counselor_sessions),
    path("session/<int:appointment_id>/prescription/", views.save_prescription),
    path('is_approved/', views.check_counselor_status),

    # Profile
    path("counselor/profile/me/", views.get_counselor_profile),
    path("counselor/profile/update/", views.update_counselor_profile),

    # application status
    path("application-status/", views.get_counselor_application_status),

    # Counselor availability
    path("availability/", views.counselor_availability_list, name="counselor_availability_list"),
    path("availability/<int:slot_id>/", views.counselor_availability_detail, name="counselor_availability_detail"),
]


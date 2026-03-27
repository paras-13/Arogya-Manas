"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import views
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.welcome_backend),
    path('api/testing/', include('apps.testing.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/mood/', include('apps.mood.urls')),
    path('api/mindfulness/', include('apps.mindfulness.urls')),
    path('api/counselor/', include('apps.counselor.urls')),
    path('api/ai_assist/', include('apps.ai_assist.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]

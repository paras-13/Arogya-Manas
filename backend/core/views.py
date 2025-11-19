from django.http import HttpResponse
def welcome_backend(request):
    return HttpResponse("This is official backend for Arogya Manas Platform")
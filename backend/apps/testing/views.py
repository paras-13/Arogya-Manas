from django.http import JsonResponse

def ping(request):
    return JsonResponse({"message": "PONG from Django!, Hello user"})

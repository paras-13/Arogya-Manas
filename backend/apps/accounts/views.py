from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User
from core.jwt_utils import generate_jwt, jwt_auth
import json


@csrf_exempt
def register(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")
        role = data.get("role")
        # print(data);
        if not username or not email or not password:
            return JsonResponse({"error": "All fields required"}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({"error" : "This email-id already exist"}, status=400)

        user = User(username=username, email=email, name=name, role=role)
        user.set_password(password)
        user.save()

        token = generate_jwt(user.id)
        return JsonResponse({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.name,
                "role" : role
            }
        }, status=201)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        email = data.get("email")
        password = data.get("password")
        role = data.get("role")

        if not email or not password or not role:
            return JsonResponse({"error": "Email, password, and role are required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"error": "Invalid email or password"}, status=401)

        if not user.check_password(password):
            return JsonResponse({"error": "Invalid email or password"}, status=401)

        if user.role != role:
            return JsonResponse({"error": f"Role mismatch. Please login as {user.role}."}, status=403)

        token = generate_jwt(user.id)
        return JsonResponse({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }, status=200)

    return JsonResponse({"error": "Invalid request method"}, status=405)

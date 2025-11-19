import jwt
from django.http import JsonResponse
from django.conf import settings
from functools import wraps
from datetime import datetime, timedelta, timezone
from functools import wraps

SECRET_KEY = settings.SECRET_KEY
JWT_ALGO = settings.JWT_ALGO  


def generate_jwt(user_id):
    """Generate JWT token for a user (timezone-aware, non-deprecated)."""
    now = datetime.now(timezone.utc) 
    payload = {
        "user_id": user_id,
        "exp": now + timedelta(hours=2),
        "iat": now
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGO)
    return token



def decode_jwt(token):
    """Decode JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGO])  # ✅ algorithms takes list
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def jwt_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"error": "Missing or invalid token"}, status=401)

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
        except Exception:
            return JsonResponse({"error": "Invalid token"}, status=401)

        # Fetch user object properly
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=401)

        # 🔥 THE IMPORTANT FIX:
        request.user = user          # Actual user instance
        request.user_id = user.id    # Your old compatibility

        return view_func(request, *args, **kwargs)

    return wrapper

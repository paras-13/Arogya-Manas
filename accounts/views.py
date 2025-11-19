from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
import secrets

from apps.accounts.models import User
from rest_framework.authtoken.models import Token
from .serializers import RegisterSerializer, LoginSerializer


def _serialize_user(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
    }


def _get_authorization_token(request):
    auth = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth:
        return None
    parts = auth.split()
    if len(parts) != 2:
        return None
    if parts[0].lower() != 'token':
        return None
    return parts[1]


def token_required(view_func):
    def _wrapped(request, *args, **kwargs):
        token_key = _get_authorization_token(request)
        if not token_key:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = Token.objects.get(key=token_key)
            request.user = token.user
            request._auth_token = token
        except Token.DoesNotExist:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_401_UNAUTHORIZED)
        return view_func(request, *args, **kwargs)

    return _wrapped


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    username = data['username']
    name = data.get('name', '')
    email = data['email'].lower()
    password = data['password']
    role = data.get('role', 'user')

    if User.objects.filter(username=username).exists():
        return Response({'detail': 'username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'detail': 'email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User(username=username, email=email, name=name, role=role)
    user.set_password(password)
    user.save()

    key = secrets.token_hex(32)
    token = Token.objects.create(key=key, user=user)

    return Response({'token': token.key, 'user': _serialize_user(user)}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not password or (not username and not email):
        return Response({'detail': 'provide username/email and password'}, status=status.HTTP_400_BAD_REQUEST)

    user = None
    try:
        if email:
            user = User.objects.get(email=email)
        elif username:
            user = User.objects.get(username=username)
    except User.DoesNotExist:
        user = None

    if not user or not user.check_password(password):
        return Response({'detail': 'invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    Token.objects.filter(user=user).delete()
    key = secrets.token_hex(32)
    token = Token.objects.create(key=key, user=user)

    return Response({'token': token.key, 'user': _serialize_user(user)})


@api_view(['POST'])
@token_required
def logout_view(request):
    try:
        request._auth_token.delete()
    except Exception:
        pass
    return Response({'detail': 'Logged out'}, status=status.HTTP_200_OK)

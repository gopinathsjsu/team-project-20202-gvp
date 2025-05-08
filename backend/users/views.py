from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer
from .models import User
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
import logging

# Get logger for users app
logger = logging.getLogger('users')

class RegisterView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
        logger.info(f"Registration attempt for username: {request.data.get('username')}")
        data = request.data
        # Remove the manual password hashing - let the UserManager handle it
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            # Use the UserManager to create the user, which will properly hash the password
            user = User.objects.create_user(
                email=data.get('email'),
                username=data.get('username'),
                password=data.get('password'),
                role=data.get('role', 'Customer')
            )
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            logger.info(f"User registered successfully: {user.username}")
            # Return the serialized user data along with tokens
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        logger.warning(f"Registration failed for username: {request.data.get('username')} - Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        username = request.data.get('username')
        logger.info(f"Login attempt for username: {username}")
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            logger.warning(f"Login failed: User not found - {username}")
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_404_NOT_FOUND)
        
        if user.check_password(request.data.get('password')):
            serializer = UserSerializer(user)
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            logger.info(f"User logged in successfully: {username}")
            return Response({
                'user': serializer.data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Login failed: Invalid password for user - {username}")
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.info("Token refresh attempt")
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            logger.warning("Token refresh failed: No refresh token provided")
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create a RefreshToken instance from the provided token
            refresh = RefreshToken(refresh_token)
            # Generate new access token
            new_access_token = str(refresh.access_token)
            
            logger.info("Token refreshed successfully")
            return Response({
                'access': new_access_token
            }, status=status.HTTP_200_OK)
        except TokenError:
            logger.error("Token refresh failed: Invalid or expired refresh token")
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
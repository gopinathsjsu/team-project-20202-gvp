from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer
from .models import User
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
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
            
            # Return the serialized user data along with tokens
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_404_NOT_FOUND)
        
        if user.check_password(password):
            serializer = UserSerializer(user)
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': serializer.data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create a RefreshToken instance from the provided token
            refresh = RefreshToken(refresh_token)
            # Generate new access token
            new_access_token = str(refresh.access_token)
            
            return Response({
                'access': new_access_token
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
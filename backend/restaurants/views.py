from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Restaurant, RestaurantHours, RestaurantPhoto
from .serializers import RestaurantSerializer, RestaurantHoursSerializer, RestaurantPhotoSerializer
from users.models import User

# Custom permission to restrict access to RestaurantManagers
class IsRestaurantManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'RestaurantManager'

# Restaurant Views
class RestaurantListCreateView(generics.ListCreateAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            # Only RestaurantManagers can create restaurants
            return [permissions.IsAuthenticated(), IsRestaurantManager()]
        # Anyone can list restaurants (e.g., Customers searching)
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        # Automatically set the manager_id to the authenticated user
        serializer.save(manager_id=self.request.user)

class RestaurantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # Only the RestaurantManager who owns it can update/delete
            return [permissions.IsAuthenticated(), IsRestaurantManager()]
        # Anyone can view details
        return [permissions.AllowAny()]

    def get_queryset(self):
        # Restrict updates/deletes to the manager's own restaurants
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return Restaurant.objects.filter(manager_id=self.request.user)
        return Restaurant.objects.all()

# RestaurantHours Views
class RestaurantHoursListCreateView(generics.ListCreateAPIView):
    serializer_class = RestaurantHoursSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        # Only show hours for restaurants managed by the user
        return RestaurantHours.objects.filter(restaurant_id__manager_id=self.request.user)

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant_id')
        restaurant = get_object_or_404(Restaurant, restaurant_id=restaurant_id, manager_id=self.request.user)
        serializer.save(restaurant_id=restaurant)

class RestaurantHoursDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RestaurantHoursSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        return RestaurantHours.objects.filter(restaurant_id__manager_id=self.request.user)

# RestaurantPhoto Views
class RestaurantPhotoListCreateView(generics.ListCreateAPIView):
    serializer_class = RestaurantPhotoSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        return RestaurantPhoto.objects.filter(restaurant_id__manager_id=self.request.user)

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant_id')
        restaurant = get_object_or_404(Restaurant, restaurant_id=restaurant_id, manager_id=self.request.user)
        serializer.save(restaurant_id=restaurant)

class RestaurantPhotoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RestaurantPhotoSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        return RestaurantPhoto.objects.filter(restaurant_id__manager_id=self.request.user)
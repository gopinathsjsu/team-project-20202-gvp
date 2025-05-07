from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Restaurant
from .serializers import RestaurantSerializer
from bookings.models import Booking, Review
from users.models import User

# Custom permission to restrict access to Admins
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Admin'

# View to get all unapproved restaurants for admin
class UnapprovedRestaurantListView(generics.ListAPIView):
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    authentication_classes = [JWTAuthentication]
    
    def get_queryset(self):
        return Restaurant.objects.filter(approved=False)

# View to get all approved restaurants for admin
class ApprovedRestaurantListView(generics.ListAPIView):
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    authentication_classes = [JWTAuthentication]
    
    def get_queryset(self):
        return Restaurant.objects.filter(approved=True)

# View to approve a restaurant
class ApproveRestaurantView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    authentication_classes = [JWTAuthentication]

    def post(self, request, restaurant_id):
        try:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_id)
            restaurant.approved = True
            restaurant.save()
            return Response({
                'message': f'Restaurant {restaurant.name} has been approved'
            }, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({
                'error': 'Restaurant not found'
            }, status=status.HTTP_404_NOT_FOUND)

# View to remove a restaurant
class RemoveRestaurantView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    authentication_classes = [JWTAuthentication]

    def delete(self, request, restaurant_id):
        try:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_id)
            restaurant_name = restaurant.name
            restaurant.delete()
            return Response({
                'message': f'Restaurant {restaurant_name} has been removed'
            }, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({
                'error': 'Restaurant not found'
            }, status=status.HTTP_404_NOT_FOUND)

# View to get analytics dashboard for the last month
class AnalyticsDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        # Calculate date range for the last month
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # Get all bookings in the last month
        bookings = Booking.objects.filter(
            booking_datetime__range=(start_date, end_date)
        )
        
        # Calculate total bookings
        total_bookings = bookings.count()
        
        # Get bookings by status
        bookings_by_status = bookings.values('status').annotate(count=Count('booking_id'))
        
        # Get top restaurants by booking count
        top_restaurants = Restaurant.objects.filter(
            bookingslot__slot_id__in=bookings.values('slot_id')
        ).annotate(
            booking_count=Count('bookingslot__booking__booking_id')
        ).order_by('-booking_count')[:5]
        
        # Format top restaurants data
        top_restaurants_data = []
        for restaurant in top_restaurants:
            top_restaurants_data.append({
                'restaurant_id': restaurant.restaurant_id,
                'name': restaurant.name,
                'booking_count': restaurant.booking_count,
                'avg_rating': Review.objects.filter(restaurant_id=restaurant).aggregate(Avg('rating'))['rating__avg'] or 0
            })
        
        # Get new restaurants in the last month
        new_restaurants = Restaurant.objects.filter(
            created_at__range=(start_date, end_date)
        ).count()
        
        # Get pending approval restaurants
        pending_restaurants = Restaurant.objects.filter(approved=False).count()
        
        # Return analytics data
        return Response({
            'total_bookings': total_bookings,
            'bookings_by_status': bookings_by_status,
            'top_restaurants': top_restaurants_data,
            'new_restaurants': new_restaurants,
            'pending_restaurants': pending_restaurants,
            'date_range': {
                'start': start_date,
                'end': end_date
            }
        }, status=status.HTTP_200_OK) 
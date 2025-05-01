from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Restaurant, RestaurantHours, RestaurantPhoto
from .serializers import RestaurantSerializer, RestaurantFullSerializer
from users.models import User
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from bookings.models import BookingSlot, Booking, Review
from django.db.models import Avg, Count
from datetime import datetime, timedelta
import pytz
from rest_framework.exceptions import ValidationError

# Custom permission to restrict access to RestaurantManagers
class IsRestaurantManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'RestaurantManager'

# Restaurant Views
class RestaurantCreateView(generics.CreateAPIView):
    serializer_class = RestaurantFullSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        serializer.save(manager_id=self.request.user)

class RestaurantUpdateView(generics.UpdateAPIView):
    serializer_class = RestaurantFullSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Restaurant.objects.filter(manager_id=self.request.user)

    def get_object(self):
        restaurant_id = self.request.data.get('restaurant_id')
        if not restaurant_id:
            raise ValidationError({'restaurant_id': 'This field is required'})
        return get_object_or_404(self.get_queryset(), restaurant_id=restaurant_id)

class RestaurantListView(generics.ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

class RestaurantTimeSlotsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request, restaurant_id):
        # Get search parameters
        date_str = request.query_params.get('date')
        time_str = request.query_params.get('time')
        num_people = request.query_params.get('people')

        if not all([date_str, time_str, num_people]):
            return Response({
                'error': 'Date, time, and number of people are required parameters'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Parse date and time
            search_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            search_datetime = pytz.UTC.localize(search_datetime)
            num_people = int(num_people)
        except ValueError:
            return Response({
                'error': 'Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get restaurant
        try:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_id, approved=True)
        except Restaurant.DoesNotExist:
            return Response({
                'error': 'Restaurant not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get day of week for the search date
        day_of_week = search_datetime.strftime('%A')

        # Check if restaurant is open
        hours = RestaurantHours.objects.filter(
            restaurant_id=restaurant,
            day_of_week=day_of_week
        ).first()
        
        if not hours:
            return Response({
                'error': 'Restaurant is closed on this day'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        open_time = datetime.combine(search_datetime.date(), hours.open_time)
        close_time = datetime.combine(search_datetime.date(), hours.close_time)
        open_time = pytz.UTC.localize(open_time)
        close_time = pytz.UTC.localize(close_time)
        
        if not (open_time <= search_datetime <= close_time):
            return Response({
                'error': 'Restaurant is not open at this time'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get available time slots
        time_slots = []
        for minutes in range(-30, 31):  # -30 to +30 minutes in 30-minute intervals
            slot_time = search_datetime + timedelta(minutes=minutes)
            
            # Check if slot is within restaurant hours
            slot_hours = RestaurantHours.objects.filter(
                restaurant_id=restaurant,
                day_of_week=slot_time.strftime('%A')
            ).first()
            
            if slot_hours:
                slot_open_time = datetime.combine(slot_time.date(), slot_hours.open_time)
                slot_close_time = datetime.combine(slot_time.date(), slot_hours.close_time)
                slot_open_time = pytz.UTC.localize(slot_open_time)
                slot_close_time = pytz.UTC.localize(slot_close_time)
                
                if slot_open_time <= slot_time <= slot_close_time:
                    # Check availability
                    slot = BookingSlot.objects.filter(
                        restaurant_id=restaurant,
                        slot_datetime=slot_time,
                        table_size__gte=num_people
                    ).first()
                    
                    if slot:
                        booked_tables = Booking.objects.filter(
                            slot_id=slot,
                            status='Booked'
                        ).count()
                        
                        if booked_tables < slot.total_tables:
                            time_slots.append({"time" : slot_time.strftime("%H:%M") , "id" : slot.slot_id})

        return Response({
            'restaurant_id': restaurant.restaurant_id,
            'name': restaurant.name,
            'available_time_slots': time_slots
        }, status=status.HTTP_200_OK)

class RestaurantDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request, restaurant_id):
        # Get restaurant
        try:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_id, approved=True)
        except Restaurant.DoesNotExist:
            return Response({
                'error': 'Restaurant not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get restaurant photos
        photos = RestaurantPhoto.objects.filter(restaurant_id=restaurant)
        photo_urls = [photo.photo_url for photo in photos]
        
        # Get average rating and reviews
        reviews = Review.objects.filter(restaurant_id=restaurant)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0

        # Format reviews
        formatted_reviews = []
        for review in reviews:
            formatted_reviews.append({
                'review_id': review.review_id,
                'rating': review.rating,
                'comment': review.comment,
                'created_at': review.created_at,
                'customer_name': review.customer_id.username
            })

        # Return detailed restaurant information
        return Response({
            'restaurant_id': restaurant.restaurant_id,
            'name': restaurant.name,
            'cuisine_type': restaurant.cuisine_type,
            'cost_rating': restaurant.cost_rating,
            'rating': round(avg_rating, 1),
            'times_booked_today': restaurant.times_booked_today,
            'address': restaurant.address,
            'city': restaurant.city,
            'state': restaurant.state,
            'zip': restaurant.zip,
            'latitude': restaurant.latitude,
            'longitude': restaurant.longitude,
            'photos': photo_urls,
            'reviews': formatted_reviews,
            'description': restaurant.description,
            'contact_info': restaurant.contact_info
        }, status=status.HTTP_200_OK)

class RestaurantSearchView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        # Get search parameters
        date_str = request.query_params.get('date')
        time_str = request.query_params.get('time')
        num_people = request.query_params.get('people')
        city = request.query_params.get('city')
        state = request.query_params.get('state')
        zip_code = request.query_params.get('zip')

        if not all([date_str, time_str, num_people]):
            return Response({
                'error': 'Date, time, and number of people are required parameters'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Parse date and time
            search_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            search_datetime = pytz.UTC.localize(search_datetime)
            num_people = int(num_people)
        except ValueError:
            return Response({
                'error': 'Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Base query for restaurants
        restaurants = Restaurant.objects.filter(approved=True)

        # Apply location filters if provided
        if city:
            restaurants = restaurants.filter(city__iexact=city)
        if state:
            restaurants = restaurants.filter(state__iexact=state)
        if zip_code:
            restaurants = restaurants.filter(zip=zip_code)

        # Get day of week for the search date
        day_of_week = search_datetime.strftime('%A')

        # Filter restaurants by operating hours
        open_restaurants = []
        for restaurant in restaurants:
            hours = RestaurantHours.objects.filter(
                restaurant_id=restaurant,
                day_of_week=day_of_week
            ).first()
            
            if hours:
                # Convert search_datetime to local time
                local_time = search_datetime.astimezone(pytz.timezone('America/Los_Angeles'))
                search_time = local_time.time()
                
                # Convert times to minutes since midnight for easier comparison
                def time_to_minutes(t):
                    return t.hour * 60 + t.minute
                
                search_minutes = time_to_minutes(search_time)
                open_minutes = time_to_minutes(hours.open_time)
                close_minutes = time_to_minutes(hours.close_time)
                
                # Handle case where closing time is on the next day (e.g., 23:59)
                if close_minutes < open_minutes:
                    close_minutes += 24 * 60  # Add 24 hours worth of minutes
                    if search_minutes < open_minutes:
                        search_minutes += 24 * 60  # Add 24 hours worth of minutes
                
                print(f"Search time: {search_time}, Minutes: {search_minutes}")
                print(f"Open time: {hours.open_time}, Minutes: {open_minutes}")
                print(f"Close time: {hours.close_time}, Minutes: {close_minutes}")
                
                if open_minutes <= search_minutes <= close_minutes:
                    open_restaurants.append(restaurant)

        # Get basic restaurant information
        results = []
        for restaurant in open_restaurants:
            # Get average rating
            avg_rating = Review.objects.filter(restaurant_id=restaurant).aggregate(Avg('rating'))['rating__avg'] or 0
            
            # Get restaurant photos
            photos = RestaurantPhoto.objects.filter(restaurant_id=restaurant)
            photo_urls = [photo.photo_url for photo in photos]
            
            results.append({
                'id': restaurant.restaurant_id,
                'name': restaurant.name,
                'cuisine': restaurant.cuisine_type,
                'ratePerPerson': restaurant.cost_rating,
                'rating': round(avg_rating, 1),
                'imageURL': photo_urls[0] if photo_urls else [],  # Return only the first photo
            })

        return Response(results, status=status.HTTP_200_OK)

class ManagerRestaurantsView(generics.ListAPIView):
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Restaurant.objects.filter(manager_id=self.request.user)
    

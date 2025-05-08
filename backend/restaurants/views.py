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
import logging

# Get logger for restaurants app
logger = logging.getLogger('restaurants')

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
        logger.info(f"Creating new restaurant for manager: {self.request.user.username}")
        serializer.save(manager_id=self.request.user)
        logger.info(f"Restaurant created successfully for manager: {self.request.user.username}")

class RestaurantUpdateView(generics.UpdateAPIView):
    serializer_class = RestaurantFullSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Restaurant.objects.filter(manager_id=self.request.user)

    def get_object(self):
        restaurant_id = self.request.data.get('restaurant_id')
        if not restaurant_id:
            logger.error(f"Restaurant update failed: restaurant_id not provided by user {self.request.user.username}")
            raise ValidationError({'restaurant_id': 'This field is required'})
        logger.info(f"Updating restaurant {restaurant_id} for manager: {self.request.user.username}")
        return get_object_or_404(self.get_queryset(), restaurant_id=restaurant_id)

class RestaurantListView(generics.ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def list(self, request, *args, **kwargs):
        logger.info("Listing all restaurants")
        return super().list(request, *args, **kwargs)

class RestaurantTimeSlotsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request, restaurant_id):
        logger.info(f"Fetching time slots for restaurant {restaurant_id}")
        # Get search parameters
        date_str = request.query_params.get('date')
        time_str = request.query_params.get('time')
        num_people = request.query_params.get('people')

        if not all([date_str, time_str, num_people]):
            logger.warning(f"Missing required parameters for restaurant {restaurant_id}")
            return Response({
                'error': 'Date, time, and number of people are required parameters'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Parse date and time
            search_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            search_datetime = pytz.UTC.localize(search_datetime)
            num_people = int(num_people)
        except ValueError:
            logger.error(f"Invalid date/time format for restaurant {restaurant_id}: {date_str} {time_str}")
            return Response({
                'error': 'Invalid date/time format. Use YYYY-MM-DD for date and HH:MM for time'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get restaurant
        try:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_id, approved=True)
        except Restaurant.DoesNotExist:
            logger.error(f"Restaurant not found: {restaurant_id}")
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
            logger.warning(f"Restaurant {restaurant_id} is closed on {day_of_week}")
            return Response({
                'error': 'Restaurant is closed on this day'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        open_time = datetime.combine(search_datetime.date(), hours.open_time)
        close_time = datetime.combine(search_datetime.date(), hours.close_time)
        open_time = pytz.UTC.localize(open_time)
        close_time = pytz.UTC.localize(close_time)
        
        if not (open_time <= search_datetime <= close_time):
            logger.warning(f"Restaurant {restaurant_id} is not open at {search_datetime}")
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

        logger.info(f"Found {len(time_slots)} available time slots for restaurant {restaurant_id}")
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

        # Get restaurant hours
        restaurant_hours = RestaurantHours.objects.filter(restaurant_id=restaurant)
        days_open = [hour.day_of_week for hour in restaurant_hours]
        
        # Use the first operating hour entry to get opening and closing times
        # This assumes all days have the same hours, which is a simplification
        # Ideally, we'd return a structured object with hours for each day
        opening_time = None
        closing_time = None
        if restaurant_hours.exists():
            first_hour = restaurant_hours.first()
            opening_time = first_hour.open_time
            closing_time = first_hour.close_time

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
            'contact_info': restaurant.contact_info,
            'days_open': days_open,
            'opening_time': opening_time.strftime('%H:%M') if opening_time else '',
            'closing_time': closing_time.strftime('%H:%M') if closing_time else '',
            'approved': restaurant.approved
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
        search_query = request.query_params.get('query')  # New parameter for name/zip search

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
        
        # Handle search query (could be name or zip)
        if search_query:
            # Check if the query is a zip code (5 digits)
            if search_query.isdigit() and len(search_query) == 5:
                restaurants = restaurants.filter(zip=search_query)
            else:
                # If not a zip code, search in restaurant names
                restaurants = restaurants.filter(name__icontains=search_query)

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

class HotRestaurantsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        # Get pagination parameters
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('pageSize', 12))
        
        # Get all approved restaurants
        restaurants = Restaurant.objects.filter(approved=True)
        
        # Build a list of restaurants with a "hotness score"
        hot_restaurants = []
        for restaurant in restaurants:
            # Calculate average rating
            reviews = Review.objects.filter(restaurant_id=restaurant)
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
            
            # Get recent reviews (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_reviews = reviews.filter(created_at__gte=thirty_days_ago).count()
            
            # Get restaurant photos
            photos = RestaurantPhoto.objects.filter(restaurant_id=restaurant)
            photo_urls = [photo.photo_url for photo in photos]
            
            # Calculate a "hotness score" based on multiple factors:
            # 1. Current bookings (40% weight)
            # 2. Average rating (30% weight)
            # 3. Recent review activity (30% weight)
            booking_score = min(restaurant.times_booked_today * 10, 100)  # Cap at 100
            rating_score = (avg_rating / 5) * 100  # Convert 0-5 rating to 0-100
            recency_score = min(recent_reviews * 5, 100)  # Cap at 100
            
            hotness_score = (
                (booking_score * 0.4) + 
                (rating_score * 0.3) + 
                (recency_score * 0.3)
            )
            
            hot_restaurants.append({
                'restaurant': restaurant,
                'hotness_score': hotness_score,
                'avg_rating': avg_rating,
                'photo_urls': photo_urls
            })
        
        # Sort restaurants by hotness score (descending)
        hot_restaurants.sort(key=lambda x: x['hotness_score'], reverse=True)
        
        # Apply pagination
        total_count = len(hot_restaurants)
        total_pages = (total_count + page_size - 1) // page_size  # Ceiling division
        
        start_index = (page - 1) * page_size
        end_index = min(start_index + page_size, total_count)
        paginated_restaurants = hot_restaurants[start_index:end_index]
        
        # Format response
        results = []
        for item in paginated_restaurants:
            restaurant = item['restaurant']
            results.append({
                'id': restaurant.restaurant_id,
                'name': restaurant.name,
                'cuisine': restaurant.cuisine_type,
                'ratePerPerson': restaurant.cost_rating,
                'rating': round(item['avg_rating'], 1),
                'imageURL': item['photo_urls'][0] if item['photo_urls'] else [],
                'hotness_score': round(item['hotness_score'], 2),
                'times_booked_today': restaurant.times_booked_today,
                'address': restaurant.address,
                'city': restaurant.city,
                'state': restaurant.state
            })
        
        response_data = {
            'results': results,
            'pagination': {
                'currentPage': page,
                'totalPages': total_pages,
                'totalCount': total_count,
                'pageSize': page_size
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    

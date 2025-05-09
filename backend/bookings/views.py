from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import BookingSlot, Booking, Review
from .serializers import (
    BookingSerializer, BookingCreateSerializer, 
    BookingSlotSerializer, BookingSlotDetailSerializer,
    ReviewSerializer
)
from restaurants.models import Restaurant, RestaurantHours
from restaurants.views import IsRestaurantManager
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import datetime, timedelta
import pytz
from django.utils import timezone
from .utils import send_booking_confirmation_email
import logging

# Get logger for bookings app
logger = logging.getLogger('bookings')

# BookingSlot Views
class BookingSlotListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        logger.info(f"Listing booking slots for manager: {self.request.user.username}")
        # Only show slots for restaurants managed by the user
        return BookingSlot.objects.filter(restaurant_id__manager_id=self.request.user)

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant_id')
        logger.info(f"Creating booking slot for restaurant {restaurant_id} by manager {self.request.user.username}")
        restaurant = get_object_or_404(Restaurant, restaurant_id=restaurant_id, manager_id=self.request.user)
        serializer.save(restaurant_id=restaurant)
        logger.info(f"Booking slot created successfully for restaurant {restaurant_id}")

class BookingSlotDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        logger.info(f"Retrieving booking slot details for manager: {self.request.user.username}")
        return BookingSlot.objects.filter(restaurant_id__manager_id=self.request.user)

# View for creating recurring booking slots
class CreateRecurringBookingSlotsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def post(self, request):
        restaurant_id = request.data.get('restaurant_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        table_sizes = request.data.get('table_sizes', [])
        
        logger.info(f"Creating recurring booking slots for restaurant {restaurant_id} from {start_date} to {end_date}")
        
        if not all([restaurant_id, start_date, end_date, table_sizes]):
            logger.warning(f"Missing required parameters for creating recurring slots: restaurant_id={restaurant_id}, start_date={start_date}, end_date={end_date}")
            return Response({
                'error': 'restaurant_id, start_date, end_date, and table_sizes are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Parse dates
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            
            # Get restaurant
            restaurant = get_object_or_404(Restaurant, restaurant_id=restaurant_id, manager_id=request.user)
            
            # Get restaurant hours
            restaurant_hours = RestaurantHours.objects.filter(restaurant_id=restaurant)
            
            if not restaurant_hours.exists():
                logger.warning(f"No operating hours defined for restaurant {restaurant_id}")
                return Response({
                    'error': 'No operating hours defined for this restaurant'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create slots for each day in the date range
            created_slots = []
            current_date = start_date
            
            while current_date <= end_date:
                day_of_week = current_date.strftime('%A')
                hours = restaurant_hours.filter(day_of_week=day_of_week).first()
                
                if hours:
                    # Create slots for each hour of operation
                    current_time = datetime.combine(current_date, hours.open_time)
                    close_time = datetime.combine(current_date, hours.close_time)
                    
                    # Create slots in 30-minute intervals
                    while current_time < close_time:
                        # Create a slot for each table size
                        for table_size in table_sizes:
                            # Check if slot already exists
                            existing_slot = BookingSlot.objects.filter(
                                restaurant_id=restaurant,
                                slot_datetime=current_time,
                                table_size=table_size
                            ).first()
                            
                            if not existing_slot:
                                # Create new slot with the exact time
                                slot = BookingSlot.objects.create(
                                    restaurant_id=restaurant,
                                    slot_datetime=current_time,
                                    table_size=table_size,
                                    total_tables=3  # Default value, can be adjusted
                                )
                                created_slots.append(slot)
                        
                        # Move to next 30-minute interval
                        current_time += timedelta(minutes=30)
                
                # Move to next day
                current_date += timedelta(days=1)
            
            logger.info(f"Successfully created {len(created_slots)} booking slots for restaurant {restaurant_id}")
            # Serialize created slots
            serializer = BookingSlotSerializer(created_slots, many=True)
            
            return Response({
                'message': f'Created {len(created_slots)} booking slots',
                'slots': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            logger.error(f"Invalid date format while creating recurring slots: {str(e)}")
            return Response({
                'error': f'Invalid date format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating booking slots: {str(e)}")
            return Response({
                'error': f'Error creating booking slots: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User Booking Views
class AvailableSlotsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, restaurant_id):
        logger.info(f"Fetching available slots for restaurant {restaurant_id}")
        # Get query parameters
        date_str = request.query_params.get('date')
        num_people = request.query_params.get('people')
        
        if not all([date_str, num_people]):
            logger.warning(f"Missing required parameters for available slots: date={date_str}, people={num_people}")
            return Response({
                'error': 'Date and number of people are required parameters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Parse date
            search_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            num_people = int(num_people)
            
            # Get restaurant
            try:
                restaurant = Restaurant.objects.get(restaurant_id=restaurant_id, approved=True)
            except Restaurant.DoesNotExist:
                logger.error(f"Restaurant not found: {restaurant_id}")
                return Response({
                    'error': 'Restaurant not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get day of week for the search date
            day_of_week = search_date.strftime('%A')
            
            # Check if restaurant is open on this day
            hours = RestaurantHours.objects.filter(
                restaurant_id=restaurant,
                day_of_week=day_of_week
            ).first()
            
            if not hours:
                logger.warning(f"Restaurant {restaurant_id} is closed on {day_of_week}")
                return Response({
                    'error': 'Restaurant is closed on this day'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get all slots for the restaurant on the specified date
            slots = BookingSlot.objects.filter(
                restaurant_id=restaurant,
                slot_datetime__date=search_date,
                table_size__gte=num_people
            ).order_by('slot_datetime')
            
            # Filter out slots that are fully booked
            available_slots = []
            for slot in slots:
                booked_tables = Booking.objects.filter(
                    slot_id=slot,
                    status='Booked'
                ).count()
                
                if booked_tables < slot.total_tables:
                    available_slots.append(slot)
            
            logger.info(f"Found {len(available_slots)} available slots for restaurant {restaurant_id}")
            # Serialize available slots
            serializer = BookingSlotDetailSerializer(available_slots, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ValueError as e:
            logger.error(f"Invalid parameter format while fetching available slots: {str(e)}")
            return Response({
                'error': f'Invalid parameter format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error retrieving available slots: {str(e)}")
            return Response({
                'error': f'Error retrieving available slots: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateBookingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logger.info(f"Creating booking for user: {request.user.username}")
        serializer = BookingCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            slot_id = request.data.get('slot_id')
            number_of_people = request.data.get('number_of_people')
            
            # Get the slot
            try:
                # Convert slot_id to integer if it's not already
                slot_id = int(slot_id) if not isinstance(slot_id, int) else slot_id
                slot = BookingSlot.objects.get(slot_id=slot_id)
            except (BookingSlot.DoesNotExist, ValueError):
                logger.error(f"Booking slot not found: {slot_id}")
                return Response({
                    'error': 'Booking slot not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if the slot is still available
            booked_tables = Booking.objects.filter(
                slot_id_id=slot.slot_id,
                status='Booked'
            ).count()
            
            if booked_tables >= slot.total_tables:
                logger.warning(f"Slot {slot_id} is fully booked")
                return Response({
                    'error': 'This slot is fully booked'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the number of people is appropriate for the table size
            if number_of_people > slot.table_size:
                logger.warning(f"Table size mismatch: requested {number_of_people} people for table size {slot.table_size}")
                return Response({
                    'error': f'This table can only accommodate up to {slot.table_size} people'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the booking
            booking = Booking.objects.create(
                customer_id=request.user,
                slot_id=slot,
                number_of_people=number_of_people,
                status='Booked'
            )
            
            # Increment the restaurant's times_booked_today counter
            restaurant = slot.restaurant_id
            restaurant.times_booked_today += 1
            restaurant.save()
            
            logger.info(f"Booking created successfully: {booking.booking_id} for user {request.user.username}")

            booking_details = {
                'restaurant_name': restaurant.name,
                'booking_date': slot.slot_datetime.strftime('%Y-%m-%d'),
                'booking_time': slot.slot_datetime.strftime('%I:%M %p'),
                'number_of_people': number_of_people,
                'booking_id': booking.booking_id
            }
            
            
            
            # Send confirmation email
            try:
                send_booking_confirmation_email(
                    user_email=request.user.email,
                    user_name=request.user.username,
                    booking_details=booking_details
                )
                logger.info(f"Confirmation email sent for booking {booking.booking_id}")
            except Exception as e:
                logger.error(f"Failed to send confirmation email for booking {booking.booking_id}: {str(e)}")
            
            return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)
        
        logger.warning(f"Invalid booking data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(customer_id=self.request.user).order_by('-booking_datetime')

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(customer_id=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only allow updating the status to 'Cancelled'
        if 'status' in request.data and request.data['status'] == 'Cancelled':
            instance.status = 'Cancelled'
            instance.save()
            
            # Decrement the restaurant's times_booked_today counter
            restaurant = instance.slot_id.restaurant_id
            restaurant.times_booked_today = max(0, restaurant.times_booked_today - 1)
            restaurant.save()
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        
        return Response({
            'error': 'Only cancelling bookings is allowed'
        }, status=status.HTTP_400_BAD_REQUEST)

class CancelBookingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(booking_id=booking_id, customer_id=request.user)
        except Booking.DoesNotExist:
            return Response({
                'error': 'Booking not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if booking.status == 'Cancelled':
            return Response({
                'error': 'Booking is already cancelled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update booking status
        booking.status = 'Cancelled'
        booking.save()
        
        # Decrement the restaurant's times_booked_today counter
        restaurant = booking.slot_id.restaurant_id
        restaurant.times_booked_today = max(0, restaurant.times_booked_today - 1)
        restaurant.save()
        
        serializer = BookingSerializer(booking)
        return Response(serializer.data)

class ReviewCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        # Get the restaurant
        restaurant = get_object_or_404(Restaurant, restaurant_id=request.data.get('restaurant_id'), approved=True)

        # Create serializer with context
        serializer = ReviewSerializer(
            data=request.data,
            context={
                'restaurant_id': restaurant,
                'customer_id': request.user
            }
        )

        if serializer.is_valid():
            # Check if user has already reviewed this restaurant
            existing_review = Review.objects.filter(
                restaurant_id=restaurant,
                customer_id=request.user
            ).first()

            if existing_review:
                return Response({
                    'error': 'You have already reviewed this restaurant'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save the review
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RestaurantReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        restaurant_id = self.kwargs['restaurant_id']
        return Review.objects.filter(restaurant_id=restaurant_id).order_by('-created_at')

class ReviewCreateBodyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        # Get the restaurant_id from request body
        restaurant_id = request.data.get('restaurant_id')
        if not restaurant_id:
            return Response({
                'error': 'restaurant_id is required in the request body'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get the restaurant
        try:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_id, approved=True)
        except Restaurant.DoesNotExist:
            return Response({
                'error': 'Restaurant not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Create serializer with context
        serializer = ReviewSerializer(
            data=request.data,
            context={
                'restaurant_id': restaurant,
                'customer_id': request.user
            }
        )

        if serializer.is_valid():
            # Check if user has already reviewed this restaurant
            existing_review = Review.objects.filter(
                restaurant_id=restaurant,
                customer_id=request.user
            ).first()

            if existing_review:
                return Response({
                    'error': 'You have already reviewed this restaurant'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save the review
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import BookingSlot, Booking
from .serializers import (
    BookingSerializer, BookingCreateSerializer, 
    BookingSlotSerializer, BookingSlotDetailSerializer
)
from restaurants.models import Restaurant, RestaurantHours
from restaurants.views import IsRestaurantManager
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import datetime, timedelta
import pytz

# BookingSlot Views
class BookingSlotListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        # Only show slots for restaurants managed by the user
        return BookingSlot.objects.filter(restaurant_id__manager_id=self.request.user)

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant_id')
        restaurant = get_object_or_404(Restaurant, restaurant_id=restaurant_id, manager_id=self.request.user)
        serializer.save(restaurant_id=restaurant)

class BookingSlotDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def get_queryset(self):
        return BookingSlot.objects.filter(restaurant_id__manager_id=self.request.user)

# View for creating recurring booking slots
class CreateRecurringBookingSlotsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRestaurantManager]

    def post(self, request):
        restaurant_id = request.data.get('restaurant_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        table_sizes = request.data.get('table_sizes', [])  # List of table sizes to create slots for
        
        if not all([restaurant_id, start_date, end_date, table_sizes]):
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
                                # Create new slot
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
            
            # Serialize created slots
            serializer = BookingSlotSerializer(created_slots, many=True)
            
            return Response({
                'message': f'Created {len(created_slots)} booking slots',
                'slots': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({
                'error': f'Invalid date format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'Error creating booking slots: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User Booking Views
class AvailableSlotsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, restaurant_id):
        # Get query parameters
        date_str = request.query_params.get('date')
        num_people = request.query_params.get('people')
        
        if not all([date_str, num_people]):
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
            
            # Serialize available slots
            serializer = BookingSlotDetailSerializer(available_slots, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({
                'error': f'Invalid parameter format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'Error retrieving available slots: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateBookingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            slot_id = serializer.validated_data.get('slot_id')
            number_of_people = serializer.validated_data.get('number_of_people')
            
            # Get the slot
            try:
                slot = BookingSlot.objects.get(slot_id=slot_id)
            except BookingSlot.DoesNotExist:
                return Response({
                    'error': 'Booking slot not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if the slot is still available
            booked_tables = Booking.objects.filter(
                slot_id=slot,
                status='Booked'
            ).count()
            
            if booked_tables >= slot.total_tables:
                return Response({
                    'error': 'This slot is fully booked'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the number of people is appropriate for the table size
            if number_of_people > slot.table_size:
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
            
            # Return the created booking
            booking_serializer = BookingSerializer(booking)
            return Response(booking_serializer.data, status=status.HTTP_201_CREATED)
        
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



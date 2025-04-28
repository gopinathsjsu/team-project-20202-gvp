from rest_framework import serializers
from .models import Booking, BookingSlot

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['booking_id', 'customer_id', 'slot_id', 'booking_datetime', 'number_of_people', 'status']
        read_only_fields = ['booking_id', 'customer_id', 'booking_datetime']

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['slot_id', 'number_of_people']

class BookingSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingSlot
        fields = ['slot_id', 'restaurant_id', 'slot_datetime', 'table_size', 'total_tables']
        read_only_fields = ['slot_id']

class BookingSlotDetailSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant_id.name', read_only=True)
    available_tables = serializers.SerializerMethodField()
    
    class Meta:
        model = BookingSlot
        fields = ['slot_id', 'restaurant_id', 'restaurant_name', 'slot_datetime', 'table_size', 'total_tables', 'available_tables']
        read_only_fields = ['slot_id', 'restaurant_name', 'available_tables']
    
    def get_available_tables(self, obj):
        booked_tables = Booking.objects.filter(slot_id=obj, status='Booked').count()
        return obj.total_tables - booked_tables
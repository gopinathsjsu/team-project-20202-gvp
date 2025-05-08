from rest_framework import serializers
from .models import Booking, BookingSlot, Review
from users.models import User
from restaurants.models import Restaurant

class BookingSerializer(serializers.ModelSerializer):
    restaurant_id = serializers.SerializerMethodField()
    slot_datetime = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ['booking_id', 'customer_id', 'slot_id', 'booking_datetime', 'number_of_people', 'status', 'restaurant_id', 'slot_datetime']
        read_only_fields = ['booking_id', 'customer_id', 'booking_datetime', 'restaurant_id', 'slot_datetime']

    def get_restaurant_id(self, obj):
        return obj.slot_id.restaurant_id.restaurant_id

    def get_slot_datetime(self, obj):
        return obj.slot_id.slot_datetime

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

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'review_id', 'restaurant_id', 'customer_id', 'rating', 
            'comment', 'created_at', 'customer_name', 'restaurant_name'
        ]
        read_only_fields = ['review_id', 'created_at', 'customer_id', 'customer_name', 'restaurant_name']

    def get_customer_name(self, obj):
        return obj.customer_id.username

    def get_restaurant_name(self, obj):
        return obj.restaurant_id.name

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def create(self, validated_data):
        # Get the restaurant and customer from the context
        restaurant_id = self.context['restaurant_id']
        customer_id = self.context['customer_id']

        # Remove restaurant_id from validated_data if it exists
        validated_data.pop('restaurant_id', None)

        # Create the review
        review = Review.objects.create(
            restaurant_id=restaurant_id,
            customer_id=customer_id,
            **validated_data
        )
        return review
from rest_framework import serializers
from .models import Restaurant, RestaurantHours, RestaurantPhoto

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            'restaurant_id', 'manager_id', 'name', 'description', 'cuisine_type', 
            'cost_rating', 'contact_info', 'address', 'times_booked_today', 
            'city', 'state', 'zip', 'latitude', 'longitude', 'approved', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['restaurant_id', 'times_booked_today', 'created_at', 'updated_at', 'approved']

class RestaurantHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantHours
        fields = ['restaurant_hours_id', 'restaurant_id', 'day_of_week', 'open_time', 'close_time']
        read_only_fields = ['restaurant_hours_id']

class RestaurantPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantPhoto
        fields = ['photo_id', 'restaurant_id', 'photo_url', 'caption', 'uploaded_at']
        read_only_fields = ['photo_id', 'uploaded_at']
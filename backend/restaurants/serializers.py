from rest_framework import serializers
from .models import Restaurant, Review

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'created_at']

class RestaurantSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    available_times = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'description', 'cuisine_type', 'cost_rating', 'address',
                  'city', 'state', 'zip_code', 'latitude', 'longitude', 'times_booked_today',
                  'average_rating', 'review_count', 'available_times']

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        return sum(review.rating for review in reviews) / len(reviews) if reviews else None

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_available_times(self, obj):
        return self.context.get('available_times', {}).get(obj.id, [])
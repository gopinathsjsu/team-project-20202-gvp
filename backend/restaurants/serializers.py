from rest_framework import serializers
from .models import Restaurant, RestaurantHours, RestaurantPhoto
import boto3
from django.conf import settings
import uuid
from datetime import datetime, timedelta
import os

def upload_to_s3(image_file, folder_name):
    """
    Upload a file to S3 bucket with proper naming convention
    Returns the URL of the uploaded file
    """
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    print(settings.AWS_ACCESS_KEY_ID)
    print(settings.AWS_SECRET_ACCESS_KEY)
    print(settings.AWS_STORAGE_BUCKET_NAME)
    print(settings.AWS_S3_REGION_NAME)
    # Generate a unique filename
    file_extension = os.path.splitext(image_file.name)[1]
    unique_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{folder_name}/{timestamp}_{unique_id}{file_extension}"

    # Create an empty folder marker in S3
    try:
        s3_client.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=f"{folder_name}/",
            Body=''
        )
    except Exception as e:
        print(f"Error creating folder marker: {str(e)}")

    # Upload the file
    s3_client.upload_fileobj(
        image_file,
        settings.AWS_STORAGE_BUCKET_NAME,
        filename,
        ExtraArgs={
            'ContentType': image_file.content_type
        }
    )

    # Generate the URL
    url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{filename}"
    return url

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

class RestaurantFullSerializer(serializers.ModelSerializer):
    days_open = serializers.ListField(child=serializers.CharField(), write_only=True)
    opening_time = serializers.TimeField(write_only=True)
    closing_time = serializers.TimeField(write_only=True)
    photos = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    table_sizes = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    available_booking_times = serializers.ListField(child=serializers.TimeField(), write_only=True, required=False)
    location = serializers.JSONField(write_only=True, required=False)
    zipcode = serializers.CharField(write_only=True, source='zip')
    manager_id = serializers.PrimaryKeyRelatedField(read_only=True)
    restaurant_photos = serializers.SerializerMethodField()
    operating_hours = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()
    location_data = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'restaurant_id', 'manager_id', 'name', 'cuisine_type', 'cost_rating', 
            'description', 'address', 'contact_info', 'days_open', 'opening_time', 
            'closing_time', 'photos', 'table_sizes', 'available_booking_times', 
            'location', 'city', 'state', 'zipcode', 'location_data', 'approved', 
            'restaurant_photos', 'operating_hours', 'available_slots'
        ]
        read_only_fields = ['restaurant_id', 'manager_id', 'approved']

    def get_restaurant_photos(self, obj):
        photos = RestaurantPhoto.objects.filter(restaurant_id=obj)
        return [{'photo_url': photo.photo_url, 'caption': photo.caption} for photo in photos]

    def get_operating_hours(self, obj):
        hours = RestaurantHours.objects.filter(restaurant_id=obj)
        return [{
            'day': hour.day_of_week,
            'open_time': hour.open_time,
            'close_time': hour.close_time
        } for hour in hours]

    def get_available_slots(self, obj):
        # Get all hours for the restaurant
        hours = RestaurantHours.objects.filter(restaurant_id=obj)
        slots = []
        
        for hour in hours:
            # Generate 30-minute slots between open and close time
            current_time = hour.open_time
            while current_time < hour.close_time:
                slots.append({
                    'day': hour.day_of_week,
                    'time': current_time.strftime('%H:%M')
                })
                # Add 30 minutes
                current_time = (datetime.combine(datetime.today(), current_time) + timedelta(minutes=30)).time()

        return slots

    def get_location_data(self, obj):
        return {
            'latitude': obj.latitude,
            'longitude': obj.longitude
        }

    def create(self, validated_data):
        # Extract nested data
        days_open = validated_data.pop('days_open')
        opening_time = validated_data.pop('opening_time')
        closing_time = validated_data.pop('closing_time')
        photos = validated_data.pop('photos', [])
        location = validated_data.pop('location', None)
        # Remove fields that don't exist in the model
        validated_data.pop('table_sizes', None)
        validated_data.pop('available_booking_times', None)
        
        # Set location data if provided
        if location:
            validated_data['latitude'] = location.get('lat')
            validated_data['longitude'] = location.get('lng')

        # Create restaurant with manager_id from context
        restaurant = super().create(validated_data)

        # Create restaurant hours for each day
        for day in days_open:
            RestaurantHours.objects.create(
                restaurant_id=restaurant,
                day_of_week=day,
                open_time=opening_time,
                close_time=closing_time
            )

        # Upload photos to S3 and create restaurant photos
        if photos:
            # Create base folder for restaurant photos
            base_folder = f'restaurants/{restaurant.restaurant_id}'
            photos_folder = f'{base_folder}/photos'
            
            # Create folder structure in S3
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            try:
                # Create base restaurant folder
                s3_client.put_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=f"{base_folder}/",
                    Body=''
                )
                # Create photos subfolder
                s3_client.put_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=f"{photos_folder}/",
                    Body=''
                )
            except Exception as e:
                print(f"Error creating S3 folders: {str(e)}")

            # Upload photos after folder structure is created
            for photo in photos:
                photo_url = upload_to_s3(photo, photos_folder)
                RestaurantPhoto.objects.create(
                    restaurant_id=restaurant,
                    photo_url=photo_url
                )

        return restaurant

    def update(self, instance, validated_data):
        # Extract nested data
        days_open = validated_data.pop('days_open', None)
        opening_time = validated_data.pop('opening_time', None)
        closing_time = validated_data.pop('closing_time', None)
        photos = validated_data.pop('photos', None)
        location = validated_data.pop('location', None)
        # Remove fields that don't exist in the model
        validated_data.pop('table_sizes', None)
        validated_data.pop('available_booking_times', None)
        
        # Update location data if provided
        if location:
            instance.latitude = location.get('lat', instance.latitude)
            instance.longitude = location.get('lng', instance.longitude)

        # Update basic restaurant info
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update restaurant hours if provided
        if days_open and opening_time and closing_time:
            # Delete existing hours
            RestaurantHours.objects.filter(restaurant_id=instance).delete()
            # Create new hours
            for day in days_open:
                RestaurantHours.objects.create(
                    restaurant_id=instance,
                    day_of_week=day,
                    open_time=opening_time,
                    close_time=closing_time
                )

        # Update photos if provided
        if photos is not None:
            # Delete existing photos
            RestaurantPhoto.objects.filter(restaurant_id=instance).delete()
            
            # Create photos folder if it doesn't exist
            photos_folder = f'restaurants/{instance.restaurant_id}/photos'
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            try:
                s3_client.put_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=f"{photos_folder}/",
                    Body=''
                )
            except Exception as e:
                print(f"Error creating S3 photos folder: {str(e)}")

            # Upload new photos to S3 and create restaurant photos
            for photo in photos:
                photo_url = upload_to_s3(photo, photos_folder)
                RestaurantPhoto.objects.create(
                    restaurant_id=instance,
                    photo_url=photo_url
                )

        return instance
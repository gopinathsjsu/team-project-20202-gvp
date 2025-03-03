from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.db.models import Count, F
from .models import BookingSlot, Restaurant
from .serializers import RestaurantSerializer

class SearchRestaurantsView(APIView):
    def get(self, request):
        date_str = request.query_params.get('date')  # e.g., '2023-10-01'
        time_str = request.query_params.get('time')  # e.g., '18:00'
        number_of_people = int(request.query_params.get('number_of_people', 1))
        city = request.query_params.get('city')
        state = request.query_params.get('state')
        zip_code = request.query_params.get('zip')

        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        time = datetime.strptime(time_str, '%H:%M').time()
        datetime_start = datetime.combine(date, time) - timedelta(minutes=30)
        datetime_end = datetime.combine(date, time) + timedelta(minutes=30)

        available_slots = BookingSlot.objects.filter(
            slot_datetime__range=(datetime_start, datetime_end),
            table_size__gte=number_of_people,
            restaurant__approved=True
        ).annotate(
            booking_count=Count('bookings')
        ).filter(
            booking_count__lt=F('total_tables')
        )

        if city:
            available_slots = available_slots.filter(restaurant__city=city)
        if state:
            available_slots = available_slots.filter(restaurant__state=state)
        if zip_code:
            available_slots = available_slots.filter(restaurant__zip_code=zip_code)

        restaurants = Restaurant.objects.filter(booking_slots__in=available_slots).distinct()

        available_times = {}
        for slot in available_slots:
            restaurant_id = slot.restaurant_id
            if restaurant_id not in available_times:
                available_times[restaurant_id] = []
            available_times[restaurant_id].append(slot.slot_datetime.strftime('%Y-%m-%d %H:%M'))

        serializer = RestaurantSerializer(restaurants, many=True, context={'available_times': available_times})
        return Response(serializer.data)
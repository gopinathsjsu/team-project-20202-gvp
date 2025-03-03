from rest_framework import generics, permissions
from .models import Booking, BookingSlot
from .serializers import BookingSerializer

class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        slot = serializer.validated_data['slot']
        number_of_people = serializer.validated_data['number_of_people']
        if number_of_people > slot.table_size:
            raise serializers.ValidationError("Number of people exceeds table size.")
        if slot.bookings.count() >= slot.total_tables:
            raise serializers.ValidationError("No tables available for this slot.")
        serializer.save(customer=self.request.user)
from django.db import models
from users.models import CustomUser
from restaurants.models import Restaurant

class BookingSlot(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='booking_slots')
    slot_datetime = models.DateTimeField()
    table_size = models.IntegerField()
    total_tables = models.IntegerField()

class Booking(models.Model):
    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bookings')
    slot = models.ForeignKey(BookingSlot, on_delete=models.CASCADE, related_name='bookings')
    booking_datetime = models.DateTimeField(auto_now_add=True)
    number_of_people = models.IntegerField()
    status = models.CharField(max_length=50, default='Booked')
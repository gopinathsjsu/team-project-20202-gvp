from django.db import models
from users.models import User
from restaurants.models import Restaurant

class BookingSlot(models.Model):
    slot_id = models.AutoField(primary_key=True)
    restaurant_id = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    slot_datetime = models.DateTimeField()
    table_size = models.IntegerField()
    total_tables = models.IntegerField()

    def __str__(self):
        return f"Slot at {self.restaurant_id.name} - {self.slot_datetime}"

class Booking(models.Model):
    STATUSES = (
        ('Booked', 'Booked'),
        ('Cancelled', 'Cancelled'),
    )
    booking_id = models.AutoField(primary_key=True)
    customer_id = models.ForeignKey(User, on_delete=models.CASCADE)
    slot_id = models.ForeignKey(BookingSlot, on_delete=models.CASCADE)
    booking_datetime = models.DateTimeField(auto_now_add=True)
    number_of_people = models.IntegerField()
    status = models.CharField(max_length=50, choices=STATUSES, default='Booked')

    def __str__(self):
        return f"Booking {self.booking_id} by {self.customer_id.username}"

class Review(models.Model):
    review_id = models.AutoField(primary_key=True)
    restaurant_id = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    customer_id = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review {self.review_id} for {self.restaurant_id.name}"
from django.urls import path
from .views import (
    BookingSlotListCreateView, 
    BookingSlotDetailView,
    CreateRecurringBookingSlotsView,
    AvailableSlotsView,
    CreateBookingView,
    UserBookingsView,
    BookingDetailView
)

urlpatterns = [
    # Booking slot management (for restaurant managers)
    path('slots/', BookingSlotListCreateView.as_view(), name='booking-slot-list-create'),
    path('slots/<int:pk>/', BookingSlotDetailView.as_view(), name='booking-slot-detail'),
    path('slots/recurring/', CreateRecurringBookingSlotsView.as_view(), name='create-recurring-booking-slots'),
    
    # User booking endpoints
    path('restaurants/<int:restaurant_id>/available-slots/', AvailableSlotsView.as_view(), name='available-slots'),
    path('bookings/', CreateBookingView.as_view(), name='create-booking'),
    path('my-bookings/', UserBookingsView.as_view(), name='user-bookings'),
    path('my-bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
]
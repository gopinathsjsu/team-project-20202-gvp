from django.urls import path
from .views import (
    BookingSlotListCreateView, 
    BookingSlotDetailView,
    CreateRecurringBookingSlotsView,
    AvailableSlotsView,
    CreateBookingView,
    UserBookingsView,
    BookingDetailView,
    CancelBookingView,
    # BookingSlotListView,
    # BookingCreateView,
    # BookingListView,
    ReviewCreateView,
    RestaurantReviewsView,
    ReviewCreateBodyView
)

urlpatterns = [
    # Booking slot management (for restaurant managers)
    path('slots/', BookingSlotListCreateView.as_view(), name='booking-slot-list-create'),
    path('slots/<int:pk>/', BookingSlotDetailView.as_view(), name='booking-slot-detail'),
    path('slots/recurring/', CreateRecurringBookingSlotsView.as_view(), name='create-recurring-booking-slots'),
    
    # User booking endpoints
    path('restaurants/<int:restaurant_id>/available-slots/', AvailableSlotsView.as_view(), name='available-slots'),
    path('create-booking/', CreateBookingView.as_view(), name='create-booking'),
    path('my-bookings/', UserBookingsView.as_view(), name='user-bookings'),
    path('my-bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('my-bookings/<int:booking_id>/cancel/', CancelBookingView.as_view(), name='cancel-booking'),

    # # Booking Slot URLs
    # path('slots/', BookingSlotListView.as_view(), name='booking-slot-list'),
    # path('slots/<int:slot_id>/', BookingSlotDetailView.as_view(), name='booking-slot-detail'),
    
    # # Booking URLs
    # path('create/', BookingCreateView.as_view(), name='booking-create'),
    # path('', BookingListView.as_view(), name='booking-list'),
    # path('<int:booking_id>/', BookingDetailView.as_view(), name='booking-detail'),
    
    # Review URLs
    path('restaurants/<int:restaurant_id>/reviews/', RestaurantReviewsView.as_view(), name='restaurant-reviews'),
    path('restaurants/<int:restaurant_id>/reviews/create/', ReviewCreateView.as_view(), name='review-create'),
    path('reviews/create/', ReviewCreateBodyView.as_view(), name='review-create-body'),
]
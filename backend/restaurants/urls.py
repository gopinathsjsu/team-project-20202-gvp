from django.urls import path
from .views import (
    RestaurantListCreateView, RestaurantDetailView,
    RestaurantHoursListCreateView, RestaurantHoursDetailView,
    RestaurantPhotoListCreateView, RestaurantPhotoDetailView,
    RestaurantSearchView, RestaurantDetailSearchView
)

urlpatterns = [
    path('', RestaurantListCreateView.as_view(), name='restaurant-list-create'),
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('hours/', RestaurantHoursListCreateView.as_view(), name='restaurant-hours-list-create'),
    path('hours/<int:pk>/', RestaurantHoursDetailView.as_view(), name='restaurant-hours-detail'),
    path('photos/', RestaurantPhotoListCreateView.as_view(), name='restaurant-photo-list-create'),
    path('photos/<int:pk>/', RestaurantPhotoDetailView.as_view(), name='restaurant-photo-detail'),
    path('search/', RestaurantSearchView.as_view(), name='restaurant-search'),
    path('search/<int:restaurant_id>/', RestaurantDetailSearchView.as_view(), name='restaurant-detail-search'),
]
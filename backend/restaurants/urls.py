from django.urls import path
from .views import (
    RestaurantCreateView, RestaurantListView, RestaurantDetailView,
    RestaurantSearchView, RestaurantDetailSearchView, ManagerRestaurantsView
)

urlpatterns = [
    path('create/', RestaurantCreateView.as_view(), name='restaurant-create'),
    path('', RestaurantListView.as_view(), name='restaurant-list'),
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('search/', RestaurantSearchView.as_view(), name='restaurant-search'),
    path('search/<int:restaurant_id>/', RestaurantDetailSearchView.as_view(), name='restaurant-detail-search'),
    path('my-restaurants/', ManagerRestaurantsView.as_view(), name='manager-restaurants'),
]
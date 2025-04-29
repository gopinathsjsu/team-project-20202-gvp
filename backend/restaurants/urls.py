from django.urls import path
from .views import (
    RestaurantCreateView, RestaurantListView, RestaurantDetailView,
    RestaurantSearchView, RestaurantDetailSearchView, ManagerRestaurantsView
)
from .admin_views import (
    UnapprovedRestaurantListView, ApprovedRestaurantListView,
    ApproveRestaurantView, RemoveRestaurantView, AnalyticsDashboardView
)

urlpatterns = [
    path('create/', RestaurantCreateView.as_view(), name='restaurant-create'),
    path('', RestaurantListView.as_view(), name='restaurant-list'),
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('search/', RestaurantSearchView.as_view(), name='restaurant-search'),
    path('search/<int:restaurant_id>/', RestaurantDetailSearchView.as_view(), name='restaurant-detail-search'),
    path('my-restaurants/', ManagerRestaurantsView.as_view(), name='manager-restaurants'),
    
    # Admin URLs
    path('admin/dashboard/', AnalyticsDashboardView.as_view(), name='admin-dashboard'),
    path('admin/unapproved/', UnapprovedRestaurantListView.as_view(), name='admin-unapproved-restaurants'),
    path('admin/approved/', ApprovedRestaurantListView.as_view(), name='admin-approved-restaurants'),
    path('admin/approve/<int:restaurant_id>/', ApproveRestaurantView.as_view(), name='admin-approve-restaurant'),
    path('admin/remove/<int:restaurant_id>/', RemoveRestaurantView.as_view(), name='admin-remove-restaurant'),
]
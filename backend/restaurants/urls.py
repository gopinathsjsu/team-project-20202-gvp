from django.urls import path
from .views import SearchRestaurantsView

urlpatterns = [
    path('search/', SearchRestaurantsView.as_view(), name='search_restaurants'),
]
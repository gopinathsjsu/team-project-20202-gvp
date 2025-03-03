from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('Customer', 'Customer'),
        ('RestaurantManager', 'RestaurantManager'),
        ('Admin', 'Admin'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Customer')
    phone = models.CharField(max_length=20, blank=True, null=True)
    # date_joined from AbstractUser serves as created_at
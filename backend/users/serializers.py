from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'password', 'role', 'phone']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # This method is not used anymore since we're creating the user directly in the view
        # But we'll keep it for compatibility with other views that might use the serializer
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            phone=validated_data.get('phone', '')
        )
        return user
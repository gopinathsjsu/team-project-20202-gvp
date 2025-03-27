# Generated by Django 5.1.6 on 2025-03-04 04:25

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Booking',
            fields=[
                ('booking_id', models.AutoField(primary_key=True, serialize=False)),
                ('booking_datetime', models.DateTimeField(auto_now_add=True)),
                ('number_of_people', models.IntegerField()),
                ('status', models.CharField(choices=[('Booked', 'Booked'), ('Cancelled', 'Cancelled')], default='Booked', max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='BookingSlot',
            fields=[
                ('slot_id', models.AutoField(primary_key=True, serialize=False)),
                ('slot_datetime', models.DateTimeField()),
                ('table_size', models.IntegerField()),
                ('total_tables', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Review',
            fields=[
                ('review_id', models.AutoField(primary_key=True, serialize=False)),
                ('rating', models.IntegerField()),
                ('comment', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]

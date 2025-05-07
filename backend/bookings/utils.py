import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from django.template.loader import render_to_string

def send_booking_confirmation_email(user_email, user_name, booking_details):
    """
    Send a booking confirmation email to the user
    """
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Booking Confirmation - Table Reservation'
        msg['From'] = settings.EMAIL_HOST_USER
        msg['To'] = user_email

        context = {
            'user_name': user_name,
            'restaurant_name': booking_details['restaurant_name'],
            'booking_date': booking_details['booking_date'],
            'booking_time': booking_details['booking_time'],
            'number_of_people': booking_details['number_of_people'],
            'booking_id': booking_details['booking_id']
        }

        # Render HTML template
        html_content = render_to_string('emails/booking_confirmation.html', context)
        
        # Attach HTML content
        msg.attach(MIMEText(html_content, 'html'))

        # Create SMTP connection
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False 
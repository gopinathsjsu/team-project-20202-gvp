from django.http import JsonResponse
import logging

# Get an instance of a logger
logger = logging.getLogger('django')

def health_check(request):
    """
    Simple health check endpoint that returns a 200 OK response.
    """
    logger.info('Health check endpoint called')
    return JsonResponse({
        'status': 'healthy',
        'message': 'Service is running'
    }) 
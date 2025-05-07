from django.http import JsonResponse

def health_check(request):
    """
    Simple health check endpoint that returns a 200 OK response.
    """
    return JsonResponse({
        'status': 'healthy',
        'message': 'Service is running'
    }) 
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        'name': 'Form Builder & Chatbot API',
        'version': '1.0.0',
        'status': 'healthy',
        'endpoints': {
            'auth': '/api/auth/',
            'dashboard_stats': '/api/dashboard/stats/',
            'forms': '/api/forms/',
            'public_forms': '/api/public/forms/<public_id>/',
            'public_submissions': '/api/public/forms/<public_id>/submissions/',
        }
    })
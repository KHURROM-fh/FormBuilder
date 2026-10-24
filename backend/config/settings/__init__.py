import os

ENVIRONMENT = os.environ.get('DJANGO_ENV', 'development').lower()

if ENVIRONMENT == 'production':
    from .production import *
else:
    from .development import *

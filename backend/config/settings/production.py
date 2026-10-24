from .base import *

DEBUG = False

ALLOWED_HOSTS = [host.strip() for host in env('ALLOWED_HOSTS', default='').split(',') if host.strip()]

# Production security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

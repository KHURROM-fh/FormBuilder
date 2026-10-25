from django.urls import path
from apps.forms.views import (
    FormListCreateView,
    FormDetailView,
    FormPublishView,
    FormUnpublishView,
    FormDuplicateView,
    PublicFormView,
    PublicSubmissionCreateView,
    FormSubmissionsListView,
    SubmissionDetailView,
    FormSubmissionsExportCSVView,
    DashboardStatsView,
)

urlpatterns = [
    # Dashboard Aggregations
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),

    # User Form Management (Protected)
    path('forms/', FormListCreateView.as_view(), name='form_list_create'),
    path('forms/<str:id>/', FormDetailView.as_view(), name='form_detail'),
    path('forms/<str:id>/publish/', FormPublishView.as_view(), name='form_publish'),
    path('forms/<str:id>/unpublish/', FormUnpublishView.as_view(), name='form_unpublish'),
    path('forms/<str:id>/duplicate/', FormDuplicateView.as_view(), name='form_duplicate'),

    # Form Submissions & CSV Export (Protected)
    path('forms/<str:id>/submissions/', FormSubmissionsListView.as_view(), name='form_submissions_list'),
    path('forms/<str:id>/submissions/export/', FormSubmissionsExportCSVView.as_view(), name='form_export_csv'),
    path('forms/<str:form_id>/submissions/<str:id>/', SubmissionDetailView.as_view(), name='submission_detail'),

    # Public Form & Chatbot Endpoints (Public)
    path('public/forms/<str:public_id>/', PublicFormView.as_view(), name='public_form'),
    path('public/forms/<str:public_id>/submissions/', PublicSubmissionCreateView.as_view(), name='public_submission_create'),
]

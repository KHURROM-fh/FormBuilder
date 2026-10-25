import csv
import uuid
from django.db.models import Count, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.forms.models import Form, Submission
from apps.forms.serializers import (
    FormListSerializer,
    FormDetailSerializer,
    PublicFormSerializer,
    SubmissionSerializer,
    SubmissionCreateSerializer,
)

"""List and create forms for the authenticated user"""
class FormListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FormDetailSerializer
        return FormListSerializer

    def get_queryset(self):
        qs = Form.objects.filter(user=self.request.user).annotate(
            submission_count=Count('submissions')
        )

        # Status filter (?status=published or ?status=draft)
        status_param = self.request.query_params.get('status')
        if status_param in ['published', 'draft']:
            qs = qs.filter(status=status_param)

        # Search query (?search=...)
        search_query = self.request.query_params.get('search')
        if search_query:
            qs = qs.filter(
                Q(title__icontains=search_query) | Q(description__icontains=search_query)
            )

        # Sorting (?sort=oldest vs default newest)
        sort_param = self.request.query_params.get('sort')
        if sort_param == 'oldest':
            qs = qs.order_by('created_at')
        else:
            qs = qs.order_by('-updated_at')

        return qs


"""Retrieve, update, or delete a specific form"""
class FormDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FormDetailSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return Form.objects.filter(user=self.request.user)


"""Publish a draft form and ensure public slug is assigned"""
class FormPublishView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        form = get_object_or_404(Form, id=id, user=request.user)

        if not form.title.strip():
            return Response(
                {"detail": "Form must have a title to be published."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not form.questions or len(form.questions) == 0:
            return Response(
                {"detail": "Form must contain at least one question to be published."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        form.status = 'published'
        form.save()
        serializer = FormDetailSerializer(form, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


"""Unpublish a form to stop accepting public responses"""
class FormUnpublishView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        form = get_object_or_404(Form, id=id, user=request.user)
        form.status = 'draft'
        form.save()
        serializer = FormDetailSerializer(form, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


"""Duplicate an existing form with fresh question IDs"""
class FormDuplicateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        original = get_object_or_404(Form, id=id, user=request.user)

        # Clone questions with new IDs
        cloned_questions = []
        for idx, q in enumerate(original.questions):
            cloned_questions.append({
                **q,
                'id': f"q_{uuid.uuid4().hex[:6]}_{idx + 1}",
            })

        new_form = Form.objects.create(
            user=request.user,
            title=f"{original.title} (Copy)",
            description=original.description,
            status='draft',
            questions=cloned_questions,
            settings=original.settings,
        )

        serializer = FormDetailSerializer(new_form, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


"""Public read-only schema endpoint for web visitors and chatbot widget"""
class PublicFormView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, public_id):
        # Allow looking up by public_id or form ID
        form = Form.objects.filter(
            Q(public_id=public_id) | Q(id=public_id),
            status='published',
        ).first()

        if not form:
            return Response(
                {"detail": "This form is unavailable or currently in draft mode."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PublicFormSerializer(form)
        return Response(serializer.data, status=status.HTTP_200_OK)


"""Submit responses from public web form or chatbot widget"""
class PublicSubmissionCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, public_id):
        form = Form.objects.filter(
            Q(public_id=public_id) | Q(id=public_id),
            status='published',
        ).first()

        if not form:
            return Response(
                {"detail": "Form not found or not currently accepting submissions."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SubmissionCreateSerializer(
            data=request.data,
            context={'form': form},
        )
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()

        return Response({
            "id": submission.id,
            "form_id": form.id,
            "submitted_at": submission.submitted_at,
            "completion_message": form.settings.get(
                "completionMessage",
                "Thank you! Your response has been submitted."
            ),
        }, status=status.HTTP_201_CREATED)


"""List submissions for a specific form"""
class FormSubmissionsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        form_id = self.kwargs.get('id')
        form = get_object_or_404(Form, id=form_id, user=self.request.user)

        qs = Submission.objects.filter(form=form)

        # Search query in answers
        search = self.request.query_params.get('search')
        if search:
            # Simple substring matching in JSON answers or ID
            qs = qs.filter(
                Q(id__icontains=search) | Q(answers__icontains=search)
            )

        sort_param = self.request.query_params.get('sort')
        if sort_param == 'oldest':
            qs = qs.order_by('submitted_at')
        else:
            qs = qs.order_by('-submitted_at')

        return qs


"""Retrieve or delete a single submission"""
class SubmissionDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionSerializer
    lookup_field = 'id'

    def get_queryset(self):
        form_id = self.kwargs.get('form_id')
        form = get_object_or_404(Form, id=form_id, user=self.request.user)
        return Submission.objects.filter(form=form)


"""Export form submissions as a clean CSV download"""
class FormSubmissionsExportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        form = get_object_or_404(Form, id=id, user=request.user)
        submissions = Submission.objects.filter(form=form).order_by('-submitted_at')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        safe_title = form.title.lower().replace(' ', '_')
        response['Content-Disposition'] = f'attachment; filename="{safe_title}_submissions.csv"'

        writer = csv.writer(response)

        # Headers: Submission ID, Submitted Date, Question 1 Label, Question 2 Label...
        question_headers = [q.get('label', f"Q{idx + 1}") for idx, q in enumerate(form.questions)]
        writer.writerow(['Submission ID', 'Submitted Date', *question_headers])

        for sub in submissions:
            row_answers = [sub.answers.get(q.get('id'), '') for q in form.questions]
            date_str = sub.submitted_at.strftime('%Y-%m-%d %H:%M:%S')
            writer.writerow([sub.id, date_str, *row_answers])

        return response


"""Aggregated statistics for the user dashboard"""
class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_forms = Form.objects.filter(user=request.user)
        total_forms = user_forms.count()
        published_forms = user_forms.filter(status='published').count()

        total_submissions = Submission.objects.filter(form__user=request.user).count()
        avg_submissions = round(total_submissions / total_forms, 1) if total_forms > 0 else 0

        recent_forms = user_forms.order_by('-updated_at')[:5]
        recent_submissions = Submission.objects.filter(
            form__user=request.user
        ).select_related('form').order_by('-submitted_at')[:5]

        return Response({
            "total_forms": total_forms,
            "published_forms": published_forms,
            "total_submissions": total_submissions,
            "avg_submissions_per_form": avg_submissions,
            "recent_forms": FormListSerializer(recent_forms, many=True).data,
            "recent_submissions": SubmissionSerializer(recent_submissions, many=True).data,
        }, status=status.HTTP_200_OK)

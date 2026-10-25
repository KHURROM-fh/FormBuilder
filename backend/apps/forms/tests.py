from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.forms.models import Form, Submission

User = get_user_model()


class FormsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='Password123!',
            name='Test Owner',
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            name='Other User',
        )
        # Authenticate as self.user
        self.client.force_authenticate(user=self.user)

        # Create a sample form
        self.sample_form = Form.objects.create(
            user=self.user,
            title='Customer Feedback',
            description='Help us improve',
            status='published',
            public_id='customer-feedback-test',
            questions=[
                {
                    'id': 'q_name',
                    'type': 'text',
                    'label': 'Your Name',
                    'required': True,
                    'order': 1,
                },
                {
                    'id': 'q_email',
                    'type': 'email',
                    'label': 'Email Address',
                    'required': True,
                    'order': 2,
                },
                {
                    'id': 'q_rating',
                    'type': 'multiple_choice',
                    'label': 'Rating',
                    'options': ['Good', 'Bad'],
                    'required': False,
                    'order': 3,
                },
            ],
            settings={
                'welcomeMessage': 'Welcome!',
                'completionMessage': 'Thank you!',
                'primaryColor': '#2563eb',
                'submitLabel': 'Send Response',
            },
        )

    def test_list_forms(self):
        """User can list their forms"""
        response = self.client.get('/api/forms/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Results can be a list or paginated dict
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.sample_form.id)

    def test_create_form(self):
        """User can create a new form"""
        payload = {
            'title': 'New Lead Form',
            'description': 'Capture leads',
            'status': 'draft',
            'questions': [
                {
                    'id': 'q_1',
                    'type': 'text',
                    'label': 'Company Name',
                    'required': True,
                    'order': 1,
                }
            ],
            'settings': {
                'welcomeMessage': 'Hello',
                'completionMessage': 'Done',
                'primaryColor': '#2563eb',
                'submitLabel': 'Submit',
            },
        }
        response = self.client.post('/api/forms/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Lead Form')
        self.assertTrue(Form.objects.filter(id=response.data['id']).exists())

    def test_form_detail_and_update(self):
        """User can get and update their form"""
        response = self.client.get(f'/api/forms/{self.sample_form.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Customer Feedback')

        # Update
        update_payload = {'title': 'Updated Feedback Title'}
        patch_response = self.client.patch(f'/api/forms/{self.sample_form.id}/', update_payload, format='json')
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.sample_form.refresh_from_db()
        self.assertEqual(self.sample_form.title, 'Updated Feedback Title')

    def test_form_publish_and_unpublish(self):
        """User can publish and unpublish a form"""
        draft_form = Form.objects.create(
            user=self.user,
            title='Draft Survey',
            status='draft',
            questions=[{'id': 'q1', 'type': 'text', 'label': 'Question 1', 'required': True, 'order': 1}],
        )
        # Publish
        pub_res = self.client.post(f'/api/forms/{draft_form.id}/publish/')
        self.assertEqual(pub_res.status_code, status.HTTP_200_OK)
        draft_form.refresh_from_db()
        self.assertEqual(draft_form.status, 'published')

        # Unpublish
        unpub_res = self.client.post(f'/api/forms/{draft_form.id}/unpublish/')
        self.assertEqual(unpub_res.status_code, status.HTTP_200_OK)
        draft_form.refresh_from_db()
        self.assertEqual(draft_form.status, 'draft')

    def test_form_duplicate(self):
        """Duplicating a form creates a draft copy with new question IDs"""
        dup_res = self.client.post(f'/api/forms/{self.sample_form.id}/duplicate/')
        self.assertEqual(dup_res.status_code, status.HTTP_201_CREATED)
        self.assertIn('(Copy)', dup_res.data['title'])
        self.assertEqual(dup_res.data['status'], 'draft')

    def test_public_form_view(self):
        """Unauthenticated visitor can view published form schema"""
        anon_client = APIClient()
        response = anon_client.get(f'/api/public/forms/{self.sample_form.public_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.sample_form.title)
        self.assertEqual(len(response.data['questions']), 3)

    def test_public_form_draft_unavailable(self):
        """Unauthenticated visitor cannot view draft form (404)"""
        draft_form = Form.objects.create(
            user=self.user,
            title='Private Draft',
            status='draft',
            public_id='private-draft-slug',
            questions=[{'id': 'q1', 'type': 'text', 'label': 'Q1', 'required': True, 'order': 1}],
        )
        anon_client = APIClient()
        response = anon_client.get(f'/api/public/forms/{draft_form.public_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_submission_creation_and_validation(self):
        """Visitor can submit answers; invalid email or missing required field errors"""
        anon_client = APIClient()

        # Missing required field q_name
        invalid_payload = {
            'answers': {
                'q_email': 'visitor@test.com',
            }
        }
        res_fail = anon_client.post(
            f'/api/public/forms/{self.sample_form.public_id}/submissions/',
            invalid_payload,
            format='json',
        )
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid email format
        bad_email_payload = {
            'answers': {
                'q_name': 'Alice Smith',
                'q_email': 'not-an-email',
            }
        }
        res_bad_email = anon_client.post(
            f'/api/public/forms/{self.sample_form.public_id}/submissions/',
            bad_email_payload,
            format='json',
        )
        self.assertEqual(res_bad_email.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid submission
        valid_payload = {
            'answers': {
                'q_name': 'Alice Smith',
                'q_email': 'alice@domain.com',
                'q_rating': 'Good',
            }
        }
        res_success = anon_client.post(
            f'/api/public/forms/{self.sample_form.public_id}/submissions/',
            valid_payload,
            format='json',
        )
        self.assertEqual(res_success.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Submission.objects.filter(form=self.sample_form).exists())
        self.assertEqual(res_success.data['completion_message'], 'Thank you!')

    def test_form_submissions_list_and_csv_export(self):
        """Form owner can view submissions list and download CSV"""
        Submission.objects.create(
            form=self.sample_form,
            answers={'q_name': 'Bob', 'q_email': 'bob@corp.io', 'q_rating': 'Good'},
        )

        # List submissions
        sub_list_res = self.client.get(f'/api/forms/{self.sample_form.id}/submissions/')
        self.assertEqual(sub_list_res.status_code, status.HTTP_200_OK)
        results = sub_list_res.data.get('results', sub_list_res.data) if isinstance(sub_list_res.data, dict) else sub_list_res.data
        self.assertEqual(len(results), 1)

        # CSV export
        csv_res = self.client.get(f'/api/forms/{self.sample_form.id}/submissions/export/')
        self.assertEqual(csv_res.status_code, status.HTTP_200_OK)
        self.assertEqual(csv_res['Content-Type'], 'text/csv; charset=utf-8')
        content = csv_res.content.decode('utf-8')
        self.assertIn('Submission ID', content)
        self.assertIn('Your Name', content)
        self.assertIn('bob@corp.io', content)

    def test_dashboard_stats(self):
        """Owner receives aggregated stats for forms and submissions"""
        Submission.objects.create(
            form=self.sample_form,
            answers={'q_name': 'Bob', 'q_email': 'bob@corp.io'},
        )
        stats_res = self.client.get('/api/dashboard/stats/')
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertEqual(stats_res.data['total_forms'], 1)
        self.assertEqual(stats_res.data['published_forms'], 1)
        self.assertEqual(stats_res.data['total_submissions'], 1)

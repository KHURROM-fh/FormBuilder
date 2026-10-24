from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class AccountsAuthTests(APITestCase):
    def setUp(self):
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'
        self.change_pwd_url = '/api/auth/change-password/'

        self.user_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'password123',
            'password2': 'password123'
        }

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_user_registration_password_mismatch(self):
        data = self.user_data.copy()
        data['password2'] = 'mismatch123'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='password123'
        )
        login_data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_user_profile_authenticated(self):
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='password123'
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')

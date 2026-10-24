from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from typing import Any


class BaseAPIView(APIView):
    """
    Base API View following Open/Closed Principle.
    Provides common response formatting and error handling.
    """
    
    def success_response(
        self, 
        data: Any = None, 
        message: str = "Success", 
        status_code: int = status.HTTP_200_OK
    ) -> Response:
        """Return a standardized success response"""
        response_data = {
            'success': True,
            'message': message,
        }
        if data is not None:
            response_data['data'] = data
        return Response(response_data, status=status_code)
    
    def error_response(
        self, 
        message: str, 
        errors: Any = None,
        status_code: int = status.HTTP_400_BAD_REQUEST
    ) -> Response:
        """Return a standardized error response"""
        response_data = {
            'success': False,
            'message': message,
        }
        if errors is not None:
            response_data['errors'] = errors
        return Response(response_data, status=status_code)

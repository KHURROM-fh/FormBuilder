from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from django.db.models import Model, QuerySet


class BaseService(ABC):
    """
    Base service class following Single Responsibility Principle.
    All business logic should be in service classes, not views.
    """
    
    model: Model = None
    
    def get_queryset(self) -> QuerySet:
        """Get the base queryset for this service"""
        if self.model is None:
            raise NotImplementedError("Model must be defined")
        return self.model.objects.all()
    
    def get_object(self, pk: int) -> Model:
        """Get a single object by primary key"""
        from apps.core.exceptions import NotFoundException
        try:
            return self.get_queryset().get(pk=pk)
        except self.model.DoesNotExist:
            raise NotFoundException(f"{self.model.__name__} not found")
    
    def list(self, filters: Optional[Dict] = None) -> QuerySet:
        """List objects with optional filtering"""
        queryset = self.get_queryset()
        if filters:
            queryset = queryset.filter(**filters)
        return queryset
    
    def create(self, validated_data: Dict) -> Model:
        """Create a new object"""
        return self.model.objects.create(**validated_data)
    
    def update(self, instance: Model, validated_data: Dict) -> Model:
        """Update an existing object"""
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
    
    def delete(self, instance: Model) -> None:
        """Delete an object"""
        instance.delete()

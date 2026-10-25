import uuid
import time
from django.db import models
from django.conf import settings
from django.utils.text import slugify


def generate_form_id():
    return f"form_{uuid.uuid4().hex[:8]}"


def generate_submission_id():
    return f"sub_{int(time.time())}_{uuid.uuid4().hex[:4]}"


def default_settings():
    return {
        "welcomeMessage": "Welcome! Please answer the questions below.",
        "completionMessage": "Thank you! Your response has been submitted.",
        "primaryColor": "#2563eb",
        "submitLabel": "Submit Form",
        "enableLiveChat": True,
        "defaultLayout": "standard",
    }


class Form(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    id = models.CharField(
        max_length=64,
        primary_key=True,
        default=generate_form_id,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='forms',
        null=True,
        blank=True,
    )
    public_id = models.CharField(
        max_length=120,
        unique=True,
        blank=True,
        db_index=True,
        help_text="Public URL slug for sharing and widget embedding",
    )
    title = models.CharField(max_length=255, default='Untitled Form')
    description = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
    )
    questions = models.JSONField(
        default=list,
        blank=True,
        help_text="List of question objects: id, type, label, placeholder, required, options, order",
    )
    settings = models.JSONField(
        default=default_settings,
        blank=True,
        help_text="Form configuration: welcomeMessage, completionMessage, primaryColor, submitLabel",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['status', 'public_id']),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"

    def save(self, *args, **kwargs):
        # Auto-generate public_id if missing
        if not self.public_id:
            base_slug = slugify(self.title) or 'form'
            unique_suffix = uuid.uuid4().hex[:6]
            self.public_id = f"{base_slug}-{unique_suffix}"
        super().save(*args, **kwargs)


class Submission(models.Model):
    id = models.CharField(
        max_length=64,
        primary_key=True,
        default=generate_submission_id,
        editable=False,
    )
    form = models.ForeignKey(
        Form,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    answers = models.JSONField(
        default=dict,
        blank=True,
        help_text="Map of question_id to answer string",
    )

    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['form', '-submitted_at']),
        ]

    def __str__(self):
        return f"Submission {self.id} for {self.form.title}"

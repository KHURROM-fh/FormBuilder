from django.contrib import admin
from apps.forms.models import Form, Submission


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'public_id', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'description', 'public_id', 'user__email')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'form', 'submitted_at')
    list_filter = ('submitted_at',)
    search_fields = ('id', 'form__title')
    readonly_fields = ('id', 'submitted_at')

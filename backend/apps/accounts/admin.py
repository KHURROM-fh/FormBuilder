from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.accounts.models import User


class UserModelAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'is_active', 'is_staff', 'is_admin', 'created_at')
    list_filter = ('is_active', 'is_staff', 'is_admin', 'created_at')
    search_fields = ('email', 'name')
    ordering = ('-created_at',)

    fieldsets = (
        ('Credentials', {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_admin', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('created_at', 'updated_at')}),
    )

    readonly_fields = ('created_at', 'updated_at')
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password'),
        }),
    )


admin.site.register(User, UserModelAdmin)

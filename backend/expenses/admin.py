from django.contrib import admin

from .models import ExpenseCategory, ExpenseCode


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active']


@admin.register(ExpenseCode)
class ExpenseCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'category', 'description', 'is_active', 'created_at']
    list_filter = ['is_active', 'category']

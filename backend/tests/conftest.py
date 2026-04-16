import pytest
from rest_framework.test import APIClient

from expenses.models import ExpenseCategory, ExpenseCode


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def category():
    return ExpenseCategory.objects.create(name='Travel')


@pytest.fixture
def inactive_category():
    return ExpenseCategory.objects.create(name='Archived', is_active=False)


@pytest.fixture
def expense_code(category):
    return ExpenseCode.objects.create(
        category=category,
        code='TRV-100',
        description='General travel',
    )


@pytest.fixture
def inactive_code(category):
    return ExpenseCode.objects.create(
        category=category,
        code='TRV-OLD',
        description='Old code',
        is_active=False,
    )

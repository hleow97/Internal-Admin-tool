import uuid

import pytest

from expenses.models import ExpenseCategory


# === GET /api/categories ===


@pytest.mark.django_db
def test_list_categories_returns_only_active(api_client, category, inactive_category):
    response = api_client.get('/api/categories/')
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['name'] == category.name


@pytest.mark.django_db
def test_list_categories_inactive_filter(api_client, category, inactive_category):
    response = api_client.get('/api/categories/', {'is_active': 'false'})
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['name'] == inactive_category.name


@pytest.mark.django_db
def test_list_categories_paginated(api_client):
    for i in range(25):
        ExpenseCategory.objects.create(name=f'Category {i:02d}')
    response = api_client.get('/api/categories/')
    assert response.status_code == 200
    assert response.data['count'] == 25
    assert len(response.data['results']) == 20
    assert response.data['next'] is not None


@pytest.mark.django_db
def test_list_categories_ordered_alphabetically(api_client):
    ExpenseCategory.objects.create(name='Zebra')
    ExpenseCategory.objects.create(name='Alpha')
    response = api_client.get('/api/categories/')
    names = [r['name'] for r in response.data['results']]
    assert names == ['Alpha', 'Zebra']


# === POST /api/categories ===


@pytest.mark.django_db
def test_create_category_success(api_client):
    response = api_client.post('/api/categories/', {'name': 'Travel'})
    assert response.status_code == 201
    assert response.data['name'] == 'Travel'
    assert response.data['is_active'] is True
    assert 'id' in response.data
    assert 'created_at' in response.data
    assert 'updated_at' in response.data


@pytest.mark.django_db
def test_create_category_whitespace_trimmed(api_client):
    response = api_client.post('/api/categories/', {'name': '  Travel  '})
    assert response.status_code == 201
    assert response.data['name'] == 'Travel'


@pytest.mark.django_db
def test_create_category_whitespace_only_name(api_client):
    response = api_client.post('/api/categories/', {'name': '   '})
    assert response.status_code == 400


@pytest.mark.django_db
def test_create_category_duplicate_name_case_insensitive(api_client, category):
    response = api_client.post('/api/categories/', {'name': category.name.upper()})
    assert response.status_code == 400
    assert 'name' in response.data


@pytest.mark.django_db
def test_create_category_missing_name(api_client):
    response = api_client.post('/api/categories/', {})
    assert response.status_code == 400
    assert 'name' in response.data


# === PUT /api/categories/{id} ===


@pytest.mark.django_db
def test_update_category_success(api_client, category):
    response = api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': 'Updated Travel',
            'is_active': True,
            'updated_at': category.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 200
    assert response.data['name'] == 'Updated Travel'


@pytest.mark.django_db
def test_update_category_soft_delete_no_active_codes(api_client, category):
    response = api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': category.name,
            'is_active': False,
            'updated_at': category.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 200
    assert response.data['is_active'] is False


@pytest.mark.django_db
def test_update_category_not_found(api_client):
    response = api_client.put(
        f'/api/categories/{uuid.uuid4()}/',
        {
            'name': 'Test',
            'is_active': True,
            'updated_at': '2026-01-01T00:00:00Z',
        },
        format='json',
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_update_category_duplicate_name(api_client, category):
    ExpenseCategory.objects.create(name='Other')
    response = api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': 'other',
            'is_active': True,
            'updated_at': category.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 400
    assert 'name' in response.data


@pytest.mark.django_db
def test_update_category_deactivate_with_active_codes(api_client, category, expense_code):
    response = api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': category.name,
            'is_active': False,
            'updated_at': category.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 400
    assert 'active code' in response.data['detail'].lower()


@pytest.mark.django_db
def test_update_category_missing_is_active(api_client, category):
    response = api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': category.name,
            'updated_at': category.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_category_stale_updated_at(api_client, category):
    # First update succeeds
    api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': 'First Update',
            'is_active': True,
            'updated_at': category.updated_at.isoformat(),
        },
        format='json',
    )
    # Second update with stale timestamp
    response = api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': 'Second Update',
            'is_active': True,
            'updated_at': category.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 409


@pytest.mark.django_db
def test_update_category_missing_updated_at(api_client, category):
    response = api_client.put(
        f'/api/categories/{category.id}/',
        {
            'name': 'Updated',
            'is_active': True,
        },
        format='json',
    )
    assert response.status_code == 400

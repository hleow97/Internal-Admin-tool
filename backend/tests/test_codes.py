import uuid

import pytest

from expenses.models import ExpenseCategory, ExpenseCode


# === GET /api/categories/{id}/codes ===


@pytest.mark.django_db
def test_list_codes_returns_only_active(api_client, category, expense_code, inactive_code):
    response = api_client.get(f'/api/categories/{category.id}/codes/')
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['code'] == expense_code.code


@pytest.mark.django_db
def test_list_codes_inactive_filter(api_client, category, expense_code, inactive_code):
    response = api_client.get(
        f'/api/categories/{category.id}/codes/', {'is_active': 'false'}
    )
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['code'] == inactive_code.code


@pytest.mark.django_db
def test_list_codes_nonexistent_category(api_client):
    response = api_client.get(f'/api/categories/{uuid.uuid4()}/codes/')
    assert response.status_code == 404


@pytest.mark.django_db
def test_list_codes_includes_nested_category(api_client, category, expense_code):
    response = api_client.get(f'/api/categories/{category.id}/codes/')
    assert response.status_code == 200
    code_data = response.data['results'][0]
    assert code_data['category']['id'] == str(category.id)
    assert code_data['category']['name'] == category.name


@pytest.mark.django_db
def test_list_codes_ordered_alphabetically(api_client, category):
    ExpenseCode.objects.create(category=category, code='ZZZ-001')
    ExpenseCode.objects.create(category=category, code='AAA-001')
    response = api_client.get(f'/api/categories/{category.id}/codes/')
    codes = [r['code'] for r in response.data['results']]
    assert codes == ['AAA-001', 'ZZZ-001']


# === POST /api/categories/{id}/codes ===


@pytest.mark.django_db
def test_create_code_success(api_client, category):
    response = api_client.post(
        f'/api/categories/{category.id}/codes/',
        {'code': 'TRV-001', 'description': 'Travel expense'},
        format='json',
    )
    assert response.status_code == 201
    assert response.data['code'] == 'TRV-001'
    assert response.data['description'] == 'Travel expense'
    assert response.data['is_active'] is True
    assert response.data['category']['id'] == str(category.id)


@pytest.mark.django_db
def test_create_code_uppercase_normalization(api_client, category):
    response = api_client.post(
        f'/api/categories/{category.id}/codes/',
        {'code': 'trv-001'},
        format='json',
    )
    assert response.status_code == 201
    assert response.data['code'] == 'TRV-001'


@pytest.mark.django_db
def test_create_code_whitespace_trimmed_and_uppercased(api_client, category):
    response = api_client.post(
        f'/api/categories/{category.id}/codes/',
        {'code': '  trv-001  '},
        format='json',
    )
    assert response.status_code == 201
    assert response.data['code'] == 'TRV-001'


@pytest.mark.django_db
def test_create_code_whitespace_only(api_client, category):
    response = api_client.post(
        f'/api/categories/{category.id}/codes/',
        {'code': '   '},
        format='json',
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_create_code_duplicate_globally(api_client, category, expense_code):
    other_category = ExpenseCategory.objects.create(name='Office')
    response = api_client.post(
        f'/api/categories/{other_category.id}/codes/',
        {'code': expense_code.code},
        format='json',
    )
    assert response.status_code == 400
    assert 'code' in response.data


@pytest.mark.django_db
def test_create_code_missing_code(api_client, category):
    response = api_client.post(
        f'/api/categories/{category.id}/codes/',
        {'description': 'Missing code field'},
        format='json',
    )
    assert response.status_code == 400
    assert 'code' in response.data


@pytest.mark.django_db
def test_create_code_nonexistent_category(api_client):
    response = api_client.post(
        f'/api/categories/{uuid.uuid4()}/codes/',
        {'code': 'TRV-001'},
        format='json',
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_create_code_optional_description(api_client, category):
    response = api_client.post(
        f'/api/categories/{category.id}/codes/',
        {'code': 'TRV-001'},
        format='json',
    )
    assert response.status_code == 201
    assert response.data['description'] == ''


# === PUT /api/codes/{id} ===


@pytest.mark.django_db
def test_update_code_success(api_client, expense_code):
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': 'UPD-001',
            'description': 'Updated description',
            'is_active': True,
            'category': str(expense_code.category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 200
    assert response.data['code'] == 'UPD-001'
    assert response.data['description'] == 'Updated description'
    assert response.data['category']['id'] == str(expense_code.category.id)


@pytest.mark.django_db
def test_update_code_soft_delete(api_client, expense_code):
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': expense_code.code,
            'description': expense_code.description,
            'is_active': False,
            'category': str(expense_code.category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 200
    assert response.data['is_active'] is False


@pytest.mark.django_db
def test_update_code_not_found(api_client, category):
    response = api_client.put(
        f'/api/codes/{uuid.uuid4()}/',
        {
            'code': 'TRV-001',
            'description': '',
            'is_active': True,
            'category': str(category.id),
            'updated_at': '2026-01-01T00:00:00Z',
        },
        format='json',
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_update_code_duplicate_code(api_client, expense_code, category):
    ExpenseCode.objects.create(category=category, code='OTHER-001')
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': 'OTHER-001',
            'description': '',
            'is_active': True,
            'category': str(category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 400
    assert 'code' in response.data


@pytest.mark.django_db
def test_update_code_missing_is_active(api_client, expense_code):
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': expense_code.code,
            'description': '',
            'category': str(expense_code.category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_code_missing_description(api_client, expense_code):
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': expense_code.code,
            'is_active': True,
            'category': str(expense_code.category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_code_empty_description_allowed(api_client, expense_code):
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': expense_code.code,
            'description': '',
            'is_active': True,
            'category': str(expense_code.category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 200
    assert response.data['description'] == ''


@pytest.mark.django_db
def test_update_code_stale_updated_at(api_client, expense_code):
    # First update succeeds
    api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': 'FIRST-001',
            'description': 'First',
            'is_active': True,
            'category': str(expense_code.category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    # Second update with stale timestamp
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': 'SECOND-001',
            'description': 'Second',
            'is_active': True,
            'category': str(expense_code.category.id),
            'updated_at': expense_code.updated_at.isoformat(),
        },
        format='json',
    )
    assert response.status_code == 409


@pytest.mark.django_db
def test_update_code_missing_updated_at(api_client, expense_code):
    response = api_client.put(
        f'/api/codes/{expense_code.id}/',
        {
            'code': expense_code.code,
            'description': '',
            'is_active': True,
            'category': str(expense_code.category.id),
        },
        format='json',
    )
    assert response.status_code == 400

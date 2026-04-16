from django.urls import path

from . import views

urlpatterns = [
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<uuid:pk>/', views.CategoryUpdateView.as_view(), name='category-update'),
    path('categories/<uuid:category_id>/codes/', views.CategoryCodesListCreateView.as_view(), name='category-codes-list-create'),
    path('codes/<uuid:pk>/', views.CodeUpdateView.as_view(), name='code-update'),
]

from django.shortcuts import get_object_or_404
from rest_framework.generics import ListCreateAPIView, UpdateAPIView

from .mixins import DeactivationBlockedError, OptimisticLockMixin
from .models import ExpenseCategory, ExpenseCode
from .serializers import (
    CategorySerializer,
    CategoryUpdateSerializer,
    ExpenseCodeSerializer,
    ExpenseCodeUpdateSerializer,
)


class CategoryListCreateView(ListCreateAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        if self.request.query_params.get('is_active') == 'false':
            return ExpenseCategory.objects.filter(is_active=False)
        return ExpenseCategory.objects.filter(is_active=True)


class CategoryUpdateView(OptimisticLockMixin, UpdateAPIView):
    queryset = ExpenseCategory.objects.all()
    serializer_class = CategoryUpdateSerializer

    def perform_update(self, serializer):
        instance = serializer.instance
        new_is_active = serializer.validated_data.get('is_active')

        if instance.is_active and new_is_active is False:
            active_count = instance.codes.filter(is_active=True).count()
            if active_count > 0:
                raise DeactivationBlockedError(
                    detail=f'Cannot deactivate category with {active_count} active code(s). Deactivate them first.'
                )

        super().perform_update(serializer)


class CategoryCodesListCreateView(ListCreateAPIView):
    serializer_class = ExpenseCodeSerializer

    def get_category(self):
        if not hasattr(self, '_category'):
            self._category = get_object_or_404(
                ExpenseCategory, pk=self.kwargs['category_id']
            )
        return self._category

    def get_queryset(self):
        category = self.get_category()
        qs = category.codes.select_related('category')
        if self.request.query_params.get('is_active') == 'false':
            return qs.filter(is_active=False)
        return qs.filter(is_active=True)

    def create(self, request, *args, **kwargs):
        self.get_category()  # 404 early if category doesn't exist
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(category=self.get_category())


class CodeUpdateView(OptimisticLockMixin, UpdateAPIView):
    queryset = ExpenseCode.objects.select_related('category')
    serializer_class = ExpenseCodeUpdateSerializer

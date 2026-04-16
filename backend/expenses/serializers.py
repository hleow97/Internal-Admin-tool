from rest_framework import serializers

from .models import ExpenseCategory, ExpenseCode


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('This field may not be blank.')
        qs = ExpenseCategory.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'expense category with this name already exists.'
            )
        return value


class CategoryUpdateSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(required=True)
    is_active = serializers.BooleanField(required=True)

    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('This field may not be blank.')
        qs = ExpenseCategory.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'expense category with this name already exists.'
            )
        return value


class ExpenseCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCode
        fields = ['id', 'category', 'code', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'category', 'is_active', 'created_at', 'updated_at']

    def validate_code(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError('This field may not be blank.')
        qs = ExpenseCode.objects.filter(code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'expense code with this code already exists.'
            )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['category'] = {
            'id': str(instance.category.id),
            'name': instance.category.name,
        }
        return data


class ExpenseCodeUpdateSerializer(serializers.ModelSerializer):
    updated_at = serializers.DateTimeField(required=True)
    is_active = serializers.BooleanField(required=True)
    description = serializers.CharField(required=True, allow_blank=True)

    class Meta:
        model = ExpenseCode
        fields = ['id', 'category', 'code', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at']

    def validate_code(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError('This field may not be blank.')
        qs = ExpenseCode.objects.filter(code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'expense code with this code already exists.'
            )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['category'] = {
            'id': str(instance.category.id),
            'name': instance.category.name,
        }
        return data

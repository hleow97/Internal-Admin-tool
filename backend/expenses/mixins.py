from django.utils import timezone
from rest_framework.exceptions import APIException


class ConflictError(APIException):
    status_code = 409
    default_detail = 'This record was modified by another user. Please refresh and try again.'
    default_code = 'conflict'


class DeactivationBlockedError(APIException):
    status_code = 400
    default_code = 'deactivation_blocked'


class OptimisticLockMixin:
    """
    Mixin for UpdateAPIView that implements optimistic locking via updated_at.

    The serializer MUST include updated_at as a required DateTimeField.
    The mixin pops updated_at from validated_data, performs an atomic
    check-and-update, and refreshes the instance from the DB.
    """

    def perform_update(self, serializer):
        expected_updated_at = serializer.validated_data.pop('updated_at')
        instance = serializer.instance

        # Build update kwargs from validated data
        update_kwargs = {}
        for key, value in serializer.validated_data.items():
            field = instance._meta.get_field(key)
            if field.is_relation:
                update_kwargs[f'{key}_id'] = value.pk if hasattr(value, 'pk') else value
            else:
                update_kwargs[key] = value

        # Manually set updated_at (queryset.update() doesn't trigger auto_now)
        update_kwargs['updated_at'] = timezone.now()

        # Atomic check-and-update: filter by PK + expected timestamp
        rows = type(instance).objects.filter(
            pk=instance.pk,
            updated_at=expected_updated_at,
        ).update(**update_kwargs)

        if rows == 0:
            raise ConflictError()

        # Refresh instance so the serializer returns fresh data
        instance.refresh_from_db()

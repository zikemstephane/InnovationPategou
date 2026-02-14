# authentication/permissions.py
from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Autorise uniquement les utilisateurs dont le rôle est 'admin'.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

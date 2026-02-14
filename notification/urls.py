from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverManagementViewSet, CourseManagementViewSet, AdminToolsViewSet

router = DefaultRouter()
# Gestion des chauffeurs
router.register(r'chauffeurs', DriverManagementViewSet, basename='admin-chauffeur')
# Gestion des courses
router.register(r'courses', CourseManagementViewSet, basename='admin-course')
# Outils (Notifications + Export)
router.register(r'outils', AdminToolsViewSet, basename='admin-outils')

urlpatterns = [
    path('api/admin/', include(router.urls)),
]
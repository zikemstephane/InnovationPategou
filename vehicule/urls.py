from django.urls import path
from .views import vehicule_list_create, vehicule_detail

urlpatterns = [
    path('', vehicule_list_create, name='vehicule_list_create'),
    path('<int:pk>/', vehicule_detail, name='vehicule_detail'),
]
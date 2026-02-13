from django.urls import path
from .views import course_list_create, course_detail, accepter_course

urlpatterns = [
    path('', course_list_create, name='course_list'),
    path('<int:pk>/', course_detail, name='course_detail'),
    path('<int:pk>/accepter/', accepter_course, name='accepter_course'),
]
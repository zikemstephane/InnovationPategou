from django.urls import path
from .views import  creer_avis, avis_chauffeur

urlpatterns = [
    # Routes pour les avis
    path('avis/', creer_avis, name='creer_avis'),
    path('avis/chauffeur/<int:chauffeur_id>/', avis_chauffeur, name='avis_chauffeur'),
]
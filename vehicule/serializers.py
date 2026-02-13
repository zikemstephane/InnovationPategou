from rest_framework import serializers
from .models import Vehicule
from authentication.models import Utilisateur

class VehiculeSerializer(serializers.ModelSerializer):
    # Champs pour l'affichage (lecture seule) : affiche le nom complet au lieu de l'ID
    proprietaire_info = serializers.SerializerMethodField()
    type = serializers.CharField(source='type_vehicule')
    chauffeur_info = serializers.SerializerMethodField()

    class Meta:
        model = Vehicule
        fields = (
            'id', 'marque', 'immatriculation', 'type', 'capacite', 'statut', 
            'proprietaire', 'proprietaire_info', 
            'id_chauffeur', 'chauffeur_info',
            'date_ajout'
        )
        # Permet d'utiliser 'type' dans l'API JSON qui sera mappé à 'type_vehicule'
        extra_kwargs = {
            'type_vehicule': {'source': 'type'}
        }

    def get_proprietaire_info(self, obj):
        if obj.proprietaire:
            return f"{obj.proprietaire.prenom} {obj.proprietaire.nom}"
        return None

    def get_chauffeur_info(self, obj):
        if obj.id_chauffeur:
            return f"{obj.id_chauffeur.prenom} {obj.id_chauffeur.nom}"
        return None

    def validate_proprietaire(self, value):
        if value.role not in ['proprietaire', 'admin']:
            raise serializers.ValidationError("Le propriétaire doit avoir le rôle 'proprietaire' ou 'admin'.")
        return value

    def validate_id_chauffeur(self, value):
        if value and value.role != 'chauffeur':
            raise serializers.ValidationError("Le chauffeur assigné doit avoir le rôle 'chauffeur'.")
        return value
from rest_framework import serializers
from .models import Course

class CourseSerializer(serializers.ModelSerializer):
    # Pour l'affichage (lecture seule)
    client_nom = serializers.ReadOnlyField(source='client.get_full_name')
    chauffeur_nom = serializers.ReadOnlyField(source='chauffeur.get_full_name', allow_null=True)
    vehicule_info = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 
            'client', 'client_nom', 
            'chauffeur', 'chauffeur_nom', 
            'vehicule', 'vehicule_info',
            'adresse_depart', 'adresse_arrivee',
            'prix', 'instructions',
            'statut', 'methode_paiement', 'est_payee',
            'date_demande'
        )
        # Ces champs sont gérés automatiquement par le système, pas par l'utilisateur
        read_only_fields = ('client', 'chauffeur', 'vehicule', 'date_demande')

    def get_vehicule_info(self, obj):
        if obj.vehicule:
            return f"{obj.vehicule.marque} ({obj.vehicule.immatriculation})"
        return None

    # Lors de la création (POST), le client est automatiquement celui qui est connecté
    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)
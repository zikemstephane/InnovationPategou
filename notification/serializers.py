from rest_framework import serializers
from authentication.models import Utilisateur
from course.models import Course
from .models import NotificationAdmin

# --- Serializer pour la gestion des chauffeurs ---
class DriverManageSerializer(serializers.ModelSerializer):
    moyenne_note = serializers.SerializerMethodField()
    total_courses = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = ('id', 'email', 'nom', 'prenom', 'telephone', 'is_active', 'moyenne_note', 'total_courses', 'date_creation')

    def get_moyenne_note(self, obj):
        # Calcul de la note moyenne reçue
        from Avis.models import Avis
        notes = Avis.objects.filter(chauffeur=obj).values_list('note', flat=True)
        if notes:
            return sum(notes) / len(notes)
        return 0.0

    def get_total_courses(self, obj):
        return obj.courses_chauffeur.filter(statut='terminee').count()

# --- Serializer pour l'intervention sur les courses ---
class CourseAdminSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source='client.email', read_only=True)
    chauffeur_email = serializers.EmailField(source='chauffeur.email', read_only=True, allow_null=True)

    class Meta:
        model = Course
        fields = '__all__' # Tous les champs pour l'admin
        read_only_fields = ('date_demande',) # L'admin ne change pas la date de création

# --- Serializer pour l'envoi de notifications ---
class NotificationSerializer(serializers.Serializer):
    type_cible = serializers.ChoiceField(choices=NotificationAdmin.TYPES_CIBLE)
    destinataire_email = serializers.EmailField(required=False, allow_null=True)
    titre = serializers.CharField(max_length=200)
    message = serializers.CharField(max_length=10000)


    def validate(self, attrs):
        if attrs['type_cible'] == 'specifique' and not attrs.get('destinataire_email'):
            raise serializers.ValidationError("L'email du destinataire est requis pour une cible spécifique.")
        return attrs
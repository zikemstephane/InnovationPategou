# ... vos imports existants ...

from vehicule import serializers
from rest_framework import serializers
from .models import Avis


class AvisSerializer(serializers.ModelSerializer):
    # Pour l'affichage, on montre le nom du chauffeur noté
    chauffeur_nom = serializers.ReadOnlyField(source='chauffeur.get_full_name')

    class Meta:
        model = Avis
        fields = ('id', 'client', 'chauffeur', 'chauffeur_nom', 'course', 'note', 'commentaire', 'date_creation')
        read_only_fields = ('client', 'chauffeur', 'date_creation')

    def validate_note(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("La note doit être comprise entre 1 et 5.")
        return value

    def validate(self, attrs):
        course = attrs.get('course')
        request = self.context.get('request')
        user = request.user

        # 1. Vérifier que l'utilisateur est bien le client de cette course
        if course.client != user:
            raise serializers.ValidationError("Vous ne pouvez noter que vos propres courses.")

        # 2. Vérifier que la course est terminée
        if course.statut != 'terminee':
            raise serializers.ValidationError("Vous ne pouvez noter que les courses terminées.")
        
        # 3. Vérifier qu'un avis n'existe pas déjà (géré par le modèle OneToOne, mais bonne pratique)
        if hasattr(course, 'avis'):
             raise serializers.ValidationError("Vous avez déjà noté cette course.")

        # 4. Assigner automatiquement le chauffeur de la course à l'avis
        # Cela empêche de noter un autre chauffeur que celui qui a conduit
        attrs['chauffeur'] = course.chauffeur
        attrs['client'] = user

        return attrs
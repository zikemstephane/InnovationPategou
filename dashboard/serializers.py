from rest_framework import serializers
from course.models import Course
from vehicule.models import Vehicule
from authentication.models import Utilisateur
from rest_framework import permissions


# Vous pouvez ajouter ceci dans votre fichier serializers.py existant

class ProprietaireCourseHistorySerializer(serializers.ModelSerializer):
    """Sérialiseur pour voir les revenus générés par la flotte du propriétaire"""
    
    client_email = serializers.EmailField(source='client.email', read_only=True)
    chauffeur_nom = serializers.CharField(source='chauffeur.nom', read_only=True)
    
    # Le propriétaire veut voir quelle voiture a effectué la course
    vehicule_info = serializers.CharField(source='vehicule.__str__', read_only=True) # Ex: "Toyota (AB-123)"
    vehicule_id = serializers.IntegerField(source='vehicule.id', read_only=True)

    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'date_demande', 'prix', 'statut', 'statut_display',
            'methode_paiement', 'client_email', 'chauffeur_nom',
            'vehicule_info', 'vehicule_id'
        ]
        


class IsProprietaire(permissions.BasePermission):
    """
    Vérifie que l'utilisateur est connecté et a le rôle 'proprietaire'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'proprietaire'
    
    
    
class UtilisateurSerializer(serializers.ModelSerializer):
    """
    Serializer pour afficher et modifier le profil.
    L'email et le rôle sont en lecture seule (read_only) pour des raisons de sécurité.
    """
    class Meta:
        model = Utilisateur
        fields = ('id', 'email', 'nom', 'prenom', 'telephone', 'role', 'photo', 'date_creation')
        read_only_fields = ('id', 'email', 'role', 'date_creation')
        
        

class CourseHistorySerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des courses d'un client"""
    
    # Afficher le nom complet du chauffeur au lieu de l'ID
    chauffeur_nom = serializers.CharField(source='chauffeur.nom', read_only=True)
    # Afficher les infos du véhicule
    vehicule_marque = serializers.CharField(source='vehicule.marque', read_only=True)
    vehicule_immatriculation = serializers.CharField(source='vehicule.immatriculation', read_only=True)
    
    # Formatter le prix si nécessaire ou le laisser tel quel
    # statut_display permet d'avoir le label lisible (ex: "Terminée" au lieu de "terminee")
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 
            'date_demande', 
            'adresse_depart', 
            'adresse_arrivee', 
            'prix', 
            'statut', 
            'statut_display',
            'methode_paiement',
            'chauffeur_nom',
            'vehicule_marque',
            'vehicule_immatriculation'
        ]
        
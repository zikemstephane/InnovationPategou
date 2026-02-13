from django.db import models
# On importe l'utilisateur depuis l'application d'authentification
from authentication.models import Utilisateur

class Vehicule(models.Model):
    # Choix pour le type de véhicule
    TYPE_CHOICES = [
        ('moto', 'Moto'),
        ('voiture', 'Voiture'),
    ]
    
    # Choix pour le statut du véhicule
    STATUT_CHOICES = [
        ('disponible', 'Disponible'),
        ('en_course', 'En course'),
        ('en_maintenance', 'En maintenance'),
        ('hors_service', 'Hors service'),
    ]

    marque = models.CharField(max_length=100)
    immatriculation = models.CharField(max_length=50, unique=True)
    type_vehicule = models.CharField(max_length=20, choices=TYPE_CHOICES)
    capacite = models.IntegerField(help_text="Nombre de places ou capacité en kg")
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='disponible')
    
    # Relation avec le propriétaire (doit être un 'proprietaire' ou 'admin' dans l'autre app)
    proprietaire = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='vehicules_possedes'
    )
    
    # Relation avec le chauffeur (doit être un 'chauffeur' dans l'autre app)
    id_chauffeur = models.ForeignKey(
        Utilisateur, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='vehicules_conduits'
    )
    
    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.marque} ({self.immatriculation})"
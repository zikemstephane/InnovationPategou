from django.db import models
from authentication.models import Utilisateur
from vehicule.models import Vehicule

class Course(models.Model):
    # Relations
    client = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='courses_client'
    )
    chauffeur = models.ForeignKey(
        Utilisateur, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='courses_chauffeur'
    )
    # On utilise une chaîne 'vehicule.Vehicule' pour éviter l'import circulaire
    vehicule = models.ForeignKey(
        Vehicule,
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='courses'
    )

    # Adresses & Coordonnées
    adresse_depart = models.CharField(max_length=255)
    adresse_arrivee = models.CharField(max_length=255)

    # Détails
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    instructions = models.TextField(blank=True, null=True)

    # État & Paiement
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('acceptee', 'Acceptée'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    
    PAIEMENT_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte'),
        ('mobile', 'Mobile Money'),
    ]

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    methode_paiement = models.CharField(max_length=20, choices=PAIEMENT_CHOICES, default='especes')
    est_payee = models.BooleanField(default=False)

    # Dates
    date_demande = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Course {self.id} - {self.adresse_arrivee}"
from django.db import models
from authentication.models import Utilisateur

class NotificationAdmin(models.Model):
    """
    Historique des notifications envoyées par l'administrateur.
    """
    TYPES_CIBLE = [
        ('specifique', 'Utilisateur Spécifique'),
        ('role_chauffeur', 'Tous les Chauffeurs'),
        ('role_client', 'Tous les Clients'),
        ('tous', 'Tous les Utilisateurs'),
    ]

    admin = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='notifications_envoyees')
    type_cible = models.CharField(max_length=20, choices=TYPES_CIBLE)
    destinataire_email = models.EmailField(blank=True, null=True, help_text="Requis si cible est 'specifique'")
    titre = models.CharField(max_length=200)
    message = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification de {self.admin.email} : {self.titre}"
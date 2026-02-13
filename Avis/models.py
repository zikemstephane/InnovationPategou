from django.db import models
from authentication.models import Utilisateur
from course.models import Course

# Create your models here.
# ... votre modèle Course existant ...

class Avis(models.Model):
    client = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='avis_donnes'
    )
    chauffeur = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='avis_recus'
    )
    course = models.OneToOneField(
        Course, 
        on_delete=models.CASCADE, 
        related_name='avis'
    )
    
    note = models.IntegerField(help_text="Note entre 1 et 5")
    commentaire = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        # S'assurer qu'on ne peut noter qu'une fois par course
        unique_together = ('client', 'course')

    def __str__(self):
        return f"Avis de {self.client.email} pour {self.chauffeur.email} ({self.note}/5)"
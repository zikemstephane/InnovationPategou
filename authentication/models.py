from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone

# ===========================
# Manager personnalisé
# ===========================
class UtilisateurManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, nom, prenom, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email doit être fourni")
        email = self.normalize_email(email)
        user = self.model(email=email, nom=nom, prenom=prenom, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nom, prenom, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Le superuser doit avoir is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Le superuser doit avoir is_superuser=True.')
        return self.create_user(email, nom, prenom, password, **extra_fields)

# ===========================
# Modèle utilisateur
# ===========================
class Utilisateur(AbstractUser):
    username = None  # suppression du champ username par défaut
    email = models.EmailField(unique=True)
    
    # Attributs supplémentaires
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('client', 'Client'),
            ('chauffeur', 'Chauffeur'),
            ('proprietaire', 'Proprietaire'),
            ('admin', 'Admin'),
        ],
        default='client'
    )
    photo = models.ImageField(upload_to='photos/', blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    # Authentification
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']  # requis pour createsuperuser

    objects = UtilisateurManager()  # <-- manager personnalisé

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.email})"

# ===========================
# OTP
# ===========================
class OTPCode(models.Model):
    user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_valid(self):
        # Le code est valide pendant 10 minutes
        return (timezone.now() - self.created_at).total_seconds() < 600

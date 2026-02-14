from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
import random

# Importations de vos modèles
from .models import Utilisateur, OTPCode
# Importation de la fonction utilitaire créée dans le fichier utils.py
from .utils import envoyer_code_otp_asynchrone


class RegisterSerializer(serializers.ModelSerializer):
    motdepasse = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Utilisateur
        fields = ('id', 'email', 'nom', 'prenom', 'telephone', 'role', 'photo', 'motdepasse', 'password_confirm')

    def validate(self, attrs):
        if attrs['motdepasse'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('motdepasse')
        
        # Création de l'utilisateur
        user = Utilisateur.objects.create(
            email=validated_data['email'],
            nom=validated_data['nom'],
            prenom=validated_data['prenom'],
            telephone=validated_data.get('telephone'),
            role=validated_data.get('role', 'client'),
            photo=validated_data.get('photo')
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    motdepasse = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('motdepasse')

        # Vérifier si l'utilisateur existe
        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError("Identifiants invalides.")

        # Vérifier le mot de passe
        if not user.check_password(password):
            raise serializers.ValidationError("Identifiants invalides.")

        # Génération du code OTP
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Sauvegarde ou mise à jour du code en base
        otp_obj, created = OTPCode.objects.update_or_create(
            user=user,
            defaults={'code': code}
        )
        
        # ENVOI EMAIL ASYNCHRONE (Correction du Timeout)
        # L'email part en arrière-plan, la réponse est immédiate pour l'utilisateur
        envoyer_code_otp_asynchrone(user.email, user.prenom, code)

        # DEBUG : Affichage dans la console Render (Logs)
        print(f"--- SIMULATION / DEBUG --- Pour {user.email}, votre code est : {code}")

        attrs['user'] = user
        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('code')

        try:
            user = Utilisateur.objects.filter(email=email).first()
            if not user:
                raise serializers.ValidationError("Utilisateur non trouvé.")    
            
            print(f"--- DEBUG --- Vérification OTP pour {user.email} avec code {code}")
            
            otp = OTPCode.objects.get(user=user, code=code)
        except OTPCode.DoesNotExist:
            raise serializers.ValidationError("Code de vérification invalide.")
        
        if not otp.is_valid():
            otp.delete()
            raise serializers.ValidationError("Le code a expiré. Veuillez vous reconnecter.")

        attrs['user'] = user
        return attrs

    def create(self, validated_data):
        user = validated_data['user']
        
        # Supprimer le code utilisé pour qu'il ne soit pas réutilisé
        OTPCode.objects.filter(user=user).delete()
        
        # Génération des tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'nom': user.nom,
                'role': user.role,
                'prenom': user.prenom
            }
        }
        
        
class UtilisateurSerializer(serializers.ModelSerializer):
    """
    Serializer pour afficher et modifier le profil.
    L'email et le rôle sont en lecture seule (read_only) pour des raisons de sécurité.
    """
    class Meta:
        model = Utilisateur
        fields = ('id', 'email', 'nom', 'prenom', 'telephone', 'role', 'photo', 'date_creation')
        read_only_fields = ('id', 'email', 'role', 'date_creation')
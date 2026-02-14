from rest_framework import serializers
from django.core.mail import send_mail
from .models import Utilisateur, OTPCode
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import Utilisateur, OTPCode
from rest_framework_simplejwt.tokens import RefreshToken
import random

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
        
        # TODO: Ici, vous ajouteriez la logique d'envoi d'email réel
        # Exemple: send_mail(user.email, code)
        try:
            send_mail(
                subject="Code de vérification pour votre connexion",
                message=f"""
                Bonjour {user.prenom},

                Votre code de connexion est : {code}

                Ce code est valide pendant 10 minutes.
                """,
                from_email="no-reply@monapp.com",
                recipient_list=[user.email],
                fail_silently=False, # Peu importe la valeur ici, le try/except gère l'erreur
            )
        except Exception as e:
            # Si l'envoi échoue (Timeout, Render bloque, etc.), on ignore l'erreur
            # On log juste l'erreur pour voir ce qui se passe
            print(f"ERREUR EMAIL (Ignorée pour ne pas planter l'app) : {e}")
        # === FIN DU BLOC DE SÉCURITÉ ===

        # On affiche le code dans la console (logs) pour que vous puissiez le copier
        print(f"--- CODE OTP POUR {user.email} : {code} ---")

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
        print(f"--- DEBUG --- Génération JWT pour {user.email} : refresh={refresh}, access={refresh.access_token}")
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
# ... à la fin de votre fichier serializers.py ...



    
    
    
    
    
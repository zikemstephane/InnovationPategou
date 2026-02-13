from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .serializers import RegisterSerializer, LoginSerializer, VerifyOTPSerializer, UtilisateurSerializer
from rest_framework.permissions import IsAuthenticated


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Utilisateur créé avec succès. Veuillez vous connecter."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Étape 1 : Envoi de l'email et mdp -> Envoi du code par email
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        return Response({"message": "Un code de vérification a été envoyé à votre adresse email."}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """
    Étape 2 : Envoi email + code -> Retourne le Token JWT
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated]) # Nécessite le Token JWT
def profile_view(request):
    """
    GET : Consulter son propre profil.
    PATCH : Modifier son propre profil (nom, prenom, telephone, photo).
    """
    user = request.user # L'utilisateur connecté grâce au Token

    if request.method == 'GET':
        # On sérialise l'utilisateur pour l'afficher
        serializer = UtilisateurSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        # partial=True permet de ne mettre à jour que les champs fournis
        serializer = UtilisateurSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
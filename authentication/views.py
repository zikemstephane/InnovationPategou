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



@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated]) 
def profile_view(request):
    """
    GET : Consulter son profil.
    PATCH : Modifier son profil.
    DELETE : Supprimer son compte.
    """
    user = request.user

    # 1. CONSULTATION (GET)
    if request.method == 'GET':
        serializer = UtilisateurSerializer(user)
        return Response(serializer.data)

    # 2. MODIFICATION (PATCH)
    elif request.method == 'PATCH':
        serializer = UtilisateurSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        # Si les données ne sont pas valides, on renvoie l'erreur ICI
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 3. SUPPRESSION (DELETE)
    elif request.method == 'DELETE':
        user.delete()
        # Le code 204 No Content signifie que la suppression a réussi mais qu'il n'y a rien à retourner
        return Response(status=status.HTTP_204_NO_CONTENT)
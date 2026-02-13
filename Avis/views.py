from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response # Important pour JSON
from rest_framework.permissions import IsAuthenticated
from .models import Avis
from .serializers import AvisSerializer

@api_view(['GET','PATCH','DELETE'])
@permission_classes([IsAuthenticated])
def avis_chauffeur(request, chauffeur_id):
    """
    Liste tous les avis reçus par un chauffeur spécifique.
    """
    if request.method == 'GET':
        avis_list = Avis.objects.filter(chauffeur_id=chauffeur_id)
        serializer = AvisSerializer(avis_list, many=True)
        return Response(serializer.data)
    elif request.method == 'PATCH':
        # Gestion de la mise à jour d'un avis (si nécessaire)
        try:
            avis = Avis.objects.get(id=request.data.get('id'), chauffeur_id=chauffeur_id)
        except Avis.DoesNotExist:
            return Response({"message": "Avis non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AvisSerializer(avis, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        try:
            avis = Avis.objects.get(id=request.data.get('id'), chauffeur_id=chauffeur_id)
            avis.delete()
            return Response({"message": "Avis supprimé avec succès."}, status=status.HTTP_204_NO_CONTENT)
        except Avis.DoesNotExist:
            return Response({"message": "Avis non trouvé."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def creer_avis(request):
    """
    Permet à un client de noter le chauffeur d'une course terminée.
    """
    # Seul un client peut noter
    if request.user.role != 'client':
        return Response({"message": "Seul un client peut laisser un avis."}, status=status.HTTP_403_FORBIDDEN)

    serializer = AvisSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
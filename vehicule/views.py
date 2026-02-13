from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Vehicule
from .serializers import VehiculeSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def vehicule_list_create(request):
    """
    GET : Liste tous les véhicules.
    POST : Crée un nouveau véhicule.
    """
    if request.method == 'GET':
        # Un propriétaire ne voit que ses véhicules ? (Optionnel, décommentez ci-dessous pour activer)
        # if request.user.role == 'proprietaire':
        #     vehicules = Vehicule.objects.filter(proprietaire=request.user)
        # else:
        #     vehicules = Vehicule.objects.all()
        
        # Pour l'instant, on liste tout (pour un admin par exemple)
        vehicules = Vehicule.objects.all()
        serializer = VehiculeSerializer(vehicules, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = VehiculeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def vehicule_detail(request, pk):
    """
    GET : Détails d'un véhicule.
    PATCH : Mise à jour partielle.
    DELETE : Suppression.
    """
    try:
        vehicule = Vehicule.objects.get(pk=pk)
    except Vehicule.DoesNotExist:
        return Response({"error": "Véhicule non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    # Sécurité : Seul le propriétaire du véhicule ou un admin peut le modifier/supprimer
    if request.user.role != 'admin' and vehicule.proprietaire != request.user:
        return Response({"error": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = VehiculeSerializer(vehicule)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = VehiculeSerializer(vehicule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        vehicule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Course
from .serializers import CourseSerializer
from vehicule.models import Vehicule 

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_list_create(request):
    if request.method == 'GET':
        courses = Course.objects.all()
        
        # Un client ne voit que ses propres courses
        if request.user.role == 'client':
            courses = courses.filter(client=request.user)
        # Un chauffeur voit les courses disponibles et celles qu'il a prises
        elif request.user.role == 'chauffeur':
            courses = courses.filter(statut='en_attente') | courses.filter(chauffeur=request.user)
            
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Seul un client peut créer une course
        if request.user.role != 'client':
            return Response({"message": "Seul un client peut créer une course."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = CourseSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def course_detail(request, pk):
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({"message": "Course non trouvée"}, status=status.HTTP_404_NOT_FOUND)

    # Vérification : Seul le client concerné ou le chauffeur assigné peut voir la course
    if course.client != request.user and course.chauffeur != request.user and request.user.role != 'admin':
        return Response({"message": "Accès non autorisé"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = CourseSerializer(course)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        # Permet de mettre à jour le statut (ex: passer de 'en_cours' à 'terminee')
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Le client peut annuler si la course est toujours en attente
        if course.client == request.user and course.statut == 'en_attente':
            course.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"message": "Impossible de supprimer cette course"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accepter_course(request, pk):
    """
    Le chauffeur accepte la course. 
    Le système assigne automatiquement le véhicule lié au chauffeur.
    """
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({"message": "Course non trouvée"}, status=status.HTTP_404_NOT_FOUND)

    # 1. Vérifications
    if request.user.role != 'chauffeur':
        return Response({"message": "Action réservée aux chauffeurs."}, status=status.HTTP_403_FORBIDDEN)

    if course.statut != 'en_attente':
        return Response({"message": "Cette course n'est plus disponible."}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Trouver le véhicule du chauffeur automatiquement
    try:
        # On cherche un véhicule où id_chauffeur est l'utilisateur connecté
        vehicule = Vehicule.objects.get(id_chauffeur=request.user)
    except Vehicule.DoesNotExist:
        return Response({"message": "Aucun véhicule assigné à ce chauffeur."}, status=status.HTTP_400_BAD_REQUEST)
    except Vehicule.MultipleObjectsReturned:
        # S'il a plusieurs véhicules, on prend le premier
        vehicule = Vehicule.objects.filter(id_chauffeur=request.user).first()

    # 3. Assignation
    course.chauffeur = request.user
    course.vehicule = vehicule
    course.statut = 'acceptee'
    course.save()

    return Response({
        "message": "Course acceptée.",
        "vehicule": f"{vehicule.marque} ({vehicule.immatriculation})",
        "course": CourseSerializer(course).data
    }, status=status.HTTP_200_OK)
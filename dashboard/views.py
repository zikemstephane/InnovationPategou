from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated

from django.db.models import Sum, Count, Q
from course.models import Course
from vehicule.models import Vehicule
from dashboard.serializers import IsProprietaire, CourseHistorySerializer
from .serializers import ProprietaireCourseHistorySerializer

# ===========================
# 1. Vue Dashboard Propriétaire (Stats)
# ===========================
class ProprietaireDashboardStatsView(APIView):
    """
    Statistiques pour le propriétaire : Revenus, flotte, chauffeurs actifs.
    """
    permission_classes = [IsProprietaire] # <--- Sécurité spécifique

    def get(self, request):
        proprietaire = request.user
        
        # 1. Récupérer les véhicules du propriétaire
        flotte = Vehicule.objects.filter(proprietaire=proprietaire)
        vehicule_ids = flotte.values_list('id', flat=True)
        
        # 2. Récupérer les courses effectuées par les véhicules de cette flotte
        # On filtre par vehicule__in (vehicule dont l'ID est dans ma flotte)
        courses_flotte = Course.objects.filter(vehicule__in=vehicule_ids)
        
        # Calculs
        total_vehicules = flotte.count()
        total_courses = courses_flotte.count()
        
        # Revenus : uniquement sur les courses terminées
        courses_terminees = courses_flotte.filter(statut='terminee')
        chiffre_affaires = courses_terminees.aggregate(
            total=Sum('prix')
        )['total'] or 0

        # Chauffeurs actifs (ceux qui ont une course "en_cours" avec un de mes véhicules)
        chauffeurs_actifs_ids = courses_flotte.filter(
            statut='en_cours'
        ).values_list('chauffeur_id', flat=True).distinct()
        
        # Véhicules actuellement en course
        vehicules_en_course = flotte.filter(statut='en_course').count()

        data = {
            "recapitulatif": {
                "total_vehicules": total_vehicules,
                "total_courses": total_courses,
                "chiffre_affaires": float(chiffre_affaires),
                "vehicules_actifs": vehicules_en_course,
                "chauffeurs_actifs": len(chauffeurs_actifs_ids)
            }
        }

        return Response(data, status=status.HTTP_200_OK)


# ===========================
# 2. Vue Historique des Gains (Liste des courses de la flotte)
# ===========================
class ProprietaireHistoryListView(generics.ListAPIView):
    """
    Liste toutes les courses effectuées par les véhicules du propriétaire.
    """
    serializer_class = ProprietaireCourseHistorySerializer
    permission_classes = [IsProprietaire]

    def get_queryset(self):
        proprietaire = self.request.user
        
        # Filtrer les courses où le véhicule appartient au propriétaire connecté
        queryset = Course.objects.filter(
            vehicule__proprietaire=proprietaire
        ).select_related('client', 'chauffeur', 'vehicule')\
         .order_by('-date_demande')
        
        return queryset
    
    

class ClientDashboardStatsView(APIView):
    """
    Retourne les statistiques globales pour le dashboard du client.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # On filtre les courses du client
        user_courses = Course.objects.filter(client=user)

        # Calcul des statistiques
        total_courses = user_courses.count()
        
        # Courses terminées uniquement (pour les stats "réelles")
        finished_courses = user_courses.filter(statut='terminee')
        
        total_spent = finished_courses.aggregate(
            total=Sum('prix')
        )['total'] or 0  # 'or 0' évite le retour None si pas de course

        total_cancelled = user_courses.filter(statut='annulee').count()

        # Dernière course (peut être utilisée pour un bouton "Reprendre" ou "Voir dernier trajet")
        last_course = user_courses.order_by('-date_demande').first()
        last_course_data = None
        if last_course:
            last_course_data = CourseHistorySerializer(last_course).data

        data = {
            "recapitulatif": {
                "total_courses": total_courses,
                "courses_terminees": finished_courses.count(),
                "total_depense": float(total_spent), # Convertir Decimal en float pour JSON
                "courses_annulees": total_cancelled,
            },
            "derniere_course": last_course_data
        }

        return Response(data, status=status.HTTP_200_OK)


# ===========================
# 2. Vue Historique (Liste complète)
# ===========================
class ClientHistoryListView(generics.ListAPIView):
    """
    Liste toutes les courses du client avec pagination.
    """
    serializer_class = CourseHistorySerializer
    permission_classes = [IsAuthenticated]
    
    # Optionnel : Pagination pour ne pas tout charger d'un coup
    # from rest_framework.pagination import PageNumberPagination
    # pagination_class = PageNumberPagination

    def get_queryset(self):
        """
        Retourne uniquement les courses du client connecté,
        triées par date décroissante (la plus récente en premier).
        On utilise select_related pour optimiser les requêtes (chauffeur, vehicule).
        """
        user = self.request.user
        return Course.objects.filter(client=user)\
                             .select_related('chauffeur', 'vehicule')\
                             .order_by('-date_demande')
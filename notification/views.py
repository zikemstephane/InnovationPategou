import csv
import threading
from django.http import HttpResponse
from django.core.mail import send_mail
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Q
from authentication.permissions import IsAdminRole
from authentication.models import Utilisateur
from course.models import Course
from .models import NotificationAdmin
from .serializers import DriverManageSerializer, CourseAdminSerializer, NotificationSerializer

# --- FONCTION D'ENVOI ASYNCHRONE (Anti-Timeout) ---
def envoi_notification_thread(titre, message, destinataires):
    """Envoie les emails en arrière-plan"""
    try:
        send_mail(
            subject=titre,
            message=message,
            from_email="admin@pategou.com", # Email de l'admin
            recipient_list=destinataires,
            fail_silently=True,
        )
        print(f"--- NOTIFICATION ENVOYÉE À {len(destinataires)} PERSONNES ---")
    except Exception as e:
        print(f"--- ERREUR ENVOI NOTIF : {e} ---")

# --- VIEWSET GESTION CHAUFFEURS ---
class DriverManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole] 
    serializer_class = DriverManageSerializer
    # On ne voit que les chauffeurs
    queryset = Utilisateur.objects.filter(role='chauffeur').order_by('-date_creation')

    @action(detail=True, methods=['post'])
    def suspendre(self, request, pk=None):
        """Suspendre un chauffeur (is_active = False)"""
        chauffeur = self.get_object()
        chauffeur.is_active = False
        chauffeur.save()
        return Response({'message': f"Chauffeur {chauffeur.email} suspendu."})

    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Réactiver un chauffeur"""
        chauffeur = self.get_object()
        chauffeur.is_active = True
        chauffeur.save()
        return Response({'message': f"Chauffeur {chauffeur.email} réactivé."})

# --- VIEWSET GESTION COURSES (Admin) ---
class CourseManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole] 
    serializer_class = CourseAdminSerializer
    queryset = Course.objects.all().select_related('client', 'chauffeur').order_by('-date_demande')

    def get_queryset(self):
        queryset = super().get_queryset()
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

# --- VIEWSET NOTIFICATIONS & EXPORT ---
class AdminToolsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminRole] 

    # 1. EXPORT CSV
    @action(detail=False, methods=['get'])
    def export_courses_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="courses_pategou.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Date', 'Client', 'Chauffeur', 'Départ', 'Arrivée', 'Prix', 'Statut', 'Payée'])

        courses = Course.objects.all().select_related('client', 'chauffeur')
        for course in courses:
            writer.writerow([
                course.id,
                course.date_demande.strftime('%Y-%m-%d %H:%M'),
                course.client.email,
                course.chauffeur.email if course.chauffeur else 'N/A',
                course.adresse_depart,
                course.adresse_arrivee,
                course.prix,
                course.statut,
                course.est_payee
            ])
        return response

    # 2. ENVOI NOTIFICATIONS
    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            destinataires_emails = []

            # Déterminer les destinataires
            if data['type_cible'] == 'specifique':
                destinataires_emails = [data['destinataire_email']]
            elif data['type_cible'] == 'role_chauffeur':
                destinataires_emails = list(Utilisateur.objects.filter(role='chauffeur').values_list('email', flat=True))
            elif data['type_cible'] == 'role_client':
                destinataires_emails = list(Utilisateur.objects.filter(role='client').values_list('email', flat=True))
            elif data['type_cible'] == 'tous':
                destinataires_emails = list(Utilisateur.objects.values_list('email', flat=True))

            # Sauvegarder en base
            notif = NotificationAdmin.objects.create(
                admin=request.user,
                type_cible=data['type_cible'],
                destinataire_email=data.get('destinataire_email'),
                titre=data['titre'],
                message=data['message']
            )

            # Lancer l'envoi en arrière-plan
            thread = threading.Thread(
                target=envoi_notification_thread,
                args=(data['titre'], data['message'], destinataires_emails)
            )
            thread.start()

            return Response({
                'message': f"Notification en cours d'envoi à {len(destinataires_emails)} destinataires.",
                'id_notification': notif.id
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
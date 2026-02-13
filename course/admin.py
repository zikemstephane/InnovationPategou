from django.contrib import admin
from .models import Course

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'chauffeur', 'vehicule', 'statut', 'prix', 'date_demande')
    list_filter = ('statut', 'date_demande', 'methode_paiement')
    search_fields = ('client__email', 'chauffeur__email', 'adresse_arrivee')
from django.contrib import admin
from .models import Vehicule

@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    list_display = ('marque', 'immatriculation', 'type_vehicule', 'statut', 'proprietaire', 'id_chauffeur')
    list_filter = ('statut', 'type_vehicule')
    search_fields = ('marque', 'immatriculation')
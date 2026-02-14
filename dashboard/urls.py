from django.urls import path

from .views import ProprietaireDashboardStatsView, ProprietaireHistoryListView, ClientDashboardStatsView, ClientHistoryListView

urlpatterns = [
    # ... URLs client existantes ...

    # URLs Propriétaire
    path('proprietaire/dashboard/stats/', ProprietaireDashboardStatsView.as_view(), name='proprietaire-stats'),
    path('proprietaire/dashboard/historique/', ProprietaireHistoryListView.as_view(), name='proprietaire-history'),
    path('client/dashboard/stats/', ClientDashboardStatsView.as_view(), name='client-stats'),
    
    # L'historique complet
    path('client/dashboard/historique/', ClientHistoryListView.as_view(), name='client-history'),
]
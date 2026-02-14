import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonList,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonNote,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonGrid,
  IonRow,
  IonCol,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  carOutline,
  timeOutline,
  locationOutline,
  flagOutline,
  cashOutline,
  cardOutline,
  star,
  starOutline,
  filterOutline,
  searchOutline,
  calendarOutline,
  reloadOutline,
  chevronForwardOutline,
  ellipse,
  checkmarkCircleOutline,
  closeCircleOutline,
  arrowBackOutline, resizeOutline, ellipsisHorizontalOutline, closeOutline, callOutline, hourglassOutline, chatbubbleOutline, repeatOutline
} from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
// Types pour les trajets
export type TripStatus = 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'annulee';
export type PaymentMethod = 'especes' | 'carte' | 'mobile_money' | 'wave';

export interface Trip {
  id: number;
  client_id: number;
  chauffeur?: {
    id: number;
    name: string;
    photo?: string;
    phone_number?: string;
    rating?: number;
  };
  vehicle?: {
    marque: string;
    modele: string;
    type_vehicule: string;
    immatriculation: string;
  };
  point_depart: { latitude: number; longitude: number };
  point_arrivee: { latitude: number; longitude: number };
  adresse_depart: string;
  adresse_arrivee: string;
  prix: number;
  instructions?: string;
  distance_km?: number;
  duree_estimee?: string;
  duree_reelle?: string;
  statut: TripStatus;
  methode_paiement: PaymentMethod;
  est_payee: boolean;
  date_demande: string;
  date_acceptation?: string;
  date_debut?: string;
  date_fin?: string;
  client_rating?: {
    note: number;
    commentaire?: string;
  };
}

// Mock data pour les trajets du client
const MOCK_TRIPS: Trip[] = [
  {
    id: 1,
    client_id: 101,
    chauffeur: {
      id: 201,
      name: 'Mohamed Koné',
      photo: 'assets/icon/default-avatar.svg',
      phone_number: '+225 07 89 01 23',
      rating: 4.9
    },
    vehicle: {
      marque: 'Toyota',
      modele: 'Corolla',
      type_vehicule: 'voiture',
      immatriculation: 'AB-123-CD'
    },
    point_depart: { latitude: 5.3300, longitude: -4.0300 },
    point_arrivee: { latitude: 5.3500, longitude: -4.0100 },
    adresse_depart: '15 Avenue Chardy, Plateau, Abidjan',
    adresse_arrivee: '50 Boulevard de Marseille, Marcory, Abidjan',
    prix: 4500,
    instructions: 'Sonner à l\'interphone',
    distance_km: 8.5,
    duree_estimee: '00:25:00',
    duree_reelle: '00:28:00',
    statut: 'terminee',
    methode_paiement: 'mobile_money',
    est_payee: true,
    date_demande: new Date(Date.now() - 86400000).toISOString(), // Hier
    date_acceptation: new Date(Date.now() - 86000000).toISOString(),
    date_debut: new Date(Date.now() - 85000000).toISOString(),
    date_fin: new Date(Date.now() - 80000000).toISOString(),
    client_rating: {
      note: 5,
      commentaire: 'Excellent chauffeur, très ponctuel'
    }
  },
  {
    id: 2,
    client_id: 101,
    chauffeur: {
      id: 202,
      name: 'Amadou Touré',
      photo: 'assets/icon/default-avatar.svg',
      phone_number: '+225 08 76 54 32',
      rating: 4.8
    },
    vehicle: {
      marque: 'Honda',
      modele: 'CB 125',
      type_vehicule: 'moto',
      immatriculation: 'AB-456-CD'
    },
    point_depart: { latitude: 5.3400, longitude: -4.0250 },
    point_arrivee: { latitude: 5.3600, longitude: -4.0150 },
    adresse_depart: '25 Rue des Jardins, Cocody, Abidjan',
    adresse_arrivee: '10 Avenue Noguès, Plateau, Abidjan',
    prix: 2500,
    distance_km: 5.2,
    duree_estimee: '00:15:00',
    duree_reelle: '00:18:00',
    statut: 'terminee',
    methode_paiement: 'especes',
    est_payee: true,
    date_demande: new Date(Date.now() - 172800000).toISOString(), // Avant-hier
    date_acceptation: new Date(Date.now() - 172000000).toISOString(),
    date_debut: new Date(Date.now() - 171000000).toISOString(),
    date_fin: new Date(Date.now() - 170000000).toISOString(),
    client_rating: {
      note: 4,
      commentaire: 'Très bien, mais un peu de retard'
    }
  },
  {
    id: 3,
    client_id: 101,
    chauffeur: {
      id: 203,
      name: 'Ibrahim Cissé',
      photo: 'assets/icon/default-avatar.svg',
      phone_number: '+225 09 87 65 43',
      rating: 4.7
    },
    vehicle: {
      marque: 'Mercedes',
      modele: 'Sprinter',
      type_vehicule: 'bus',
      immatriculation: 'AB-789-CD'
    },
    point_depart: { latitude: 5.3700, longitude: -4.0350 },
    point_arrivee: { latitude: 5.3900, longitude: -4.0200 },
    adresse_depart: 'Gare routière d\'Adjamé, Abidjan',
    adresse_arrivee: 'Université de Cocody, Abidjan',
    prix: 15000,
    instructions: 'Attendre au parking',
    distance_km: 12.8,
    duree_estimee: '00:35:00',
    statut: 'en_cours',
    methode_paiement: 'wave',
    est_payee: false,
    date_demande: new Date(Date.now() - 3600000).toISOString(), // Il y a 1h
    date_acceptation: new Date(Date.now() - 3500000).toISOString(),
    date_debut: new Date(Date.now() - 3400000).toISOString()
  },
  {
    id: 4,
    client_id: 101,
    chauffeur: {
      id: 204,
      name: 'Ousmane Diallo',
      photo: 'assets/icon/default-avatar.svg',
      phone_number: '+225 01 23 45 67',
      rating: 4.5
    },
    vehicle: {
      marque: 'Yamaha',
      modele: 'MT-07',
      type_vehicule: 'moto',
      immatriculation: 'CD-123-EF'
    },
    point_depart: { latitude: 5.3200, longitude: -4.0450 },
    point_arrivee: { latitude: 5.3400, longitude: -4.0350 },
    adresse_depart: 'Marché de Treichville, Abidjan',
    adresse_arrivee: 'Centre commercial, Marcory, Abidjan',
    prix: 1800,
    distance_km: 3.5,
    duree_estimee: '00:10:00',
    statut: 'acceptee',
    methode_paiement: 'mobile_money',
    est_payee: false,
    date_demande: new Date(Date.now() - 1800000).toISOString(), // Il y a 30min
    date_acceptation: new Date(Date.now() - 1700000).toISOString()
  },
  {
    id: 5,
    client_id: 101,
    chauffeur: {
      id: 205,
      name: 'Fatou Diop',
      photo: 'assets/icon/default-avatar.svg',
      phone_number: '+225 02 34 56 78',
      rating: 4.6
    },
    vehicle: {
      marque: 'Hyundai',
      modele: 'i10',
      type_vehicule: 'voiture',
      immatriculation: 'EF-456-GH'
    },
    point_depart: { latitude: 5.3100, longitude: -4.0250 },
    point_arrivee: { latitude: 5.3300, longitude: -4.0150 },
    adresse_depart: 'Aéroport FHB, Abidjan',
    adresse_arrivee: 'Hôtel Ivoire, Cocody, Abidjan',
    prix: 8500,
    distance_km: 15.2,
    duree_estimee: '00:35:00',
    statut: 'annulee',
    methode_paiement: 'carte',
    est_payee: false,
    date_demande: new Date(Date.now() - 259200000).toISOString(), // Il y a 3 jours
    date_acceptation: new Date(Date.now() - 258000000).toISOString()
  }
];

@Component({
  selector: 'app-trips',
  templateUrl: './trips.page.html',
  styleUrls: ['./trips.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge,
    IonChip,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonList,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonNote,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonGrid,
    IonRow,
    IonCol,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class TripsPage implements OnInit {
  // Données
  allTrips: Trip[] = [];
  filteredTrips: Trip[] = [];
  groupedTrips: { date: string; trips: Trip[] }[] = [];

  // États
  isLoading = true;
  isRefreshing = false;
  showFilterModal = false;
  searchQuery = '';
  selectedSegment: 'all' | 'active' | 'completed' | 'cancelled' = 'all';

  // Statistiques
  stats = {
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0
  };

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ closeOutline, star, callOutline, locationOutline, flagOutline, calendarOutline, timeOutline, resizeOutline, hourglassOutline, cashOutline, cardOutline, chatbubbleOutline, starOutline, repeatOutline, filterOutline, carOutline, ellipsisHorizontalOutline, chevronForwardOutline, searchOutline, reloadOutline, ellipse, checkmarkCircleOutline, closeCircleOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.loadTrips();
  }

  // ================================
  // CHARGEMENT DES DONNÉES
  // ================================

  loadTrips(event?: any) {
    this.isLoading = true;

    // Simuler un chargement depuis une API
    setTimeout(() => {
      // Trier par date (plus récent d'abord)
      this.allTrips = MOCK_TRIPS.sort((a, b) =>
        new Date(b.date_demande).getTime() - new Date(a.date_demande).getTime()
      );

      this.calculateStats();
      this.applyFilters();
      this.isLoading = false;
      this.isRefreshing = false;

      if (event) {
        event.target.complete();
      }
    }, 1000);
  }

  doRefresh(event: any) {
    this.isRefreshing = true;
    this.loadTrips(event);
  }

  // ================================
  // STATISTIQUES
  // ================================

  calculateStats() {
    this.stats = {
      total: this.allTrips.length,
      active: this.allTrips.filter(t => ['en_attente', 'acceptee', 'en_cours'].includes(t.statut)).length,
      completed: this.allTrips.filter(t => t.statut === 'terminee').length,
      cancelled: this.allTrips.filter(t => t.statut === 'annulee').length,
      totalSpent: this.allTrips
        .filter(t => t.statut === 'terminee')
        .reduce((sum, t) => sum + t.prix, 0)
    };
  }

  // ================================
  // FILTRES
  // ================================

  applyFilters() {
    let filtered = [...this.allTrips];

    // Filtre par segment
    switch (this.selectedSegment) {
      case 'active':
        filtered = filtered.filter(t => ['en_attente', 'acceptee', 'en_cours'].includes(t.statut));
        break;
      case 'completed':
        filtered = filtered.filter(t => t.statut === 'terminee');
        break;
      case 'cancelled':
        filtered = filtered.filter(t => t.statut === 'annulee');
        break;
    }

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.adresse_depart.toLowerCase().includes(query) ||
        t.adresse_arrivee.toLowerCase().includes(query) ||
        t.chauffeur?.name.toLowerCase().includes(query)
      );
    }

    this.filteredTrips = filtered;
    this.groupTripsByDate();
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.applyFilters();
    this.showFilterModal = false;
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value;
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  resetFilters() {
    this.selectedSegment = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  // ================================
  // GROUPEMENT PAR DATE
  // ================================

  groupTripsByDate() {
    const groups: { [key: string]: Trip[] } = {};

    this.filteredTrips.forEach(trip => {
      const date = new Date(trip.date_demande).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(trip);
    });

    this.groupedTrips = Object.keys(groups).map(date => ({
      date,
      trips: groups[date]
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ================================
  // FORMATAGE
  // ================================

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-FR') + ' XOF';
  }

  formatDuration(duration?: string): string {
    if (!duration) return 'N/A';
    const [hours, minutes] = duration.split(':');
    if (hours === '00') {
      return `${minutes} min`;
    }
    return `${parseInt(hours)}h ${minutes}min`;
  }

  // ================================
  // STATUS
  // ================================

  getStatusColor(status: TripStatus): string {
    const colors: Record<TripStatus, string> = {
      en_attente: 'warning',
      acceptee: 'primary',
      en_cours: 'success',
      terminee: 'medium',
      annulee: 'danger'
    };
    return colors[status];
  }

  getStatusText(status: TripStatus): string {
    const texts: Record<TripStatus, string> = {
      en_attente: 'En attente',
      acceptee: 'Acceptée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée'
    };
    return texts[status];
  }

  getStatusIcon(status: TripStatus): string {
    const icons: Record<TripStatus, string> = {
      en_attente: 'time-outline',
      acceptee: 'checkmark-circle-outline',
      en_cours: 'car-outline',
      terminee: 'flag-outline',
      annulee: 'close-circle-outline'
    };
    return icons[status];
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      especes: 'Espèces',
      carte: 'Carte',
      mobile_money: 'Mobile Money',
      wave: 'Wave'
    };
    return labels[method];
  }

  getVehicleIcon(type: string): string {
    const icons: Record<string, string> = {
      moto: 'bicycle-outline',
      voiture: 'car-outline',
      bus: 'bus-outline'
    };
    return icons[type] || 'car-outline';
  }

  // ================================
  // ACTIONS
  // ================================

  // viewTripDetails(tripId: number) {
  //   this.router.navigate(['/client/trip-detail', tripId]);
  // }

  async rateTrip(tripId: number, driverId: number) {
    this.router.navigate(['/rate-ride', tripId, driverId]);
  }

  async contactDriver(phoneNumber: string) {
    const alert = await this.alertCtrl.create({
      header: 'Contacter le chauffeur',
      message: `Appeler au ${phoneNumber} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Appeler',
          handler: () => {
            window.open(`tel:${phoneNumber}`, '_system');
          }
        }
      ]
    });
    await alert.present();
  }

  async repeatTrip(trip: Trip) {
    const alert = await this.alertCtrl.create({
      header: 'Répéter ce trajet',
      message: 'Voulez-vous créer une nouvelle course avec les mêmes adresses ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Continuer',
          handler: () => {
            // Naviguer vers la page de création avec les adresses pré-remplies
            this.router.navigate(['/client/create-ride'], {
              state: {
                adresse_depart: trip.adresse_depart,
                adresse_arrivee: trip.adresse_arrivee
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async showTripOptions(trip: Trip) {
    const buttons = [];

    if (trip.statut === 'terminee') {
      if (!trip.client_rating) {
        buttons.push({
          text: 'Noter cette course',
          handler: () => this.rateTrip(trip.id, trip.chauffeur!.id)
        });
      }
      buttons.push({
        text: 'Répéter ce trajet',
        handler: () => this.repeatTrip(trip)
      });
    }

    if (trip.chauffeur?.phone_number) {
      buttons.push({
        text: 'Contacter le chauffeur',
        handler: () => this.contactDriver(trip.chauffeur!.phone_number!)
      });
    }

    buttons.push({
      text: 'Annuler',
      role: 'cancel'
    });

    const alert = await this.alertCtrl.create({
      header: 'Options',
      buttons
    });
    await alert.present();
  }

  // ================================
  // UTILITAIRES
  // ================================

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/home']);
  }
  // Ajouter ces propriétés dans la classe TripsPage
showDetailModal = false;
selectedTrip: Trip | null = null;

// Ajouter ces méthodes
viewTripDetails(tripId: number) {
  const trip = this.allTrips.find(t => t.id === tripId);
  if (trip) {
    this.selectedTrip = trip;
    this.showDetailModal = true;
  }
}

closeDetailModal() {
  this.showDetailModal = false;
  this.selectedTrip = null;
}
}
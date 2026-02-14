import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/application/models/ride';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonNote,
  IonButton,
  IonBadge,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonSkeletonText,
  IonAvatar,
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
  searchOutline,
  calendarOutline,
  bicycleOutline,
  busOutline,
  addOutline,
  personOutline,
  notificationsOutline,
  repeatOutline,
  heartOutline,
  settingsOutline,
  compassOutline,
  trendingUpOutline,
  airplaneOutline,
  trainOutline,
  chevronForwardOutline,
  homeOutline,
  businessOutline,
  ellipsisHorizontalOutline
} from 'ionicons/icons';

import { Ride } from 'src/app/application/models/ride';
import { RideService } from 'src/app/infrastructure/services/ride';
import { Auth } from 'src/app/infrastructure/services/auth/auth';
import { NotificationService } from 'src/app/infrastructure/services/notification';
import { GeolocationService } from 'src/app/infrastructure/services/geolocation-service';

// Interface pour les adresses favorites
export interface FavoriteAddress {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  icon: string;
}

// Interface pour les préférences utilisateur
export interface UserPreferences {
  favoriteAddresses: FavoriteAddress[];
  defaultPaymentMethod: 'especes' | 'carte' | 'mobile_money' | 'wave';
  defaultVehicleType: 'moto' | 'voiture' | 'bus';
  recentSearches: string[];
}

@Component({
  selector: 'app-home',
  templateUrl: './homep.page.html',
  styleUrls: ['./homep.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton,
    IonRefresher, IonRefresherContent, IonFab, IonFabButton, IonIcon,
    IonList, IonItem, IonLabel, IonThumbnail, IonNote, IonButton,
    IonBadge, IonSearchbar, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonChip, IonSkeletonText, IonAvatar, IonGrid, IonRow, IonCol
  ]
})
export class HomeP implements OnInit, OnDestroy {

  // --- État du composant ---
  recentRides: Ride[] = [];
  isLoading = false;
  searchQuery: string = '';
  searchSuggestions: any[] = [];
  showSuggestions = false;

  // Données utilisateur
  userName: string = 'Passager';
  userAvatar: string = 'assets/icon/default-avatar.svg';
  unreadNotifications: number = 3; // À remplacer par vraie donnée

  // Adresses favorites
  favoriteAddresses: FavoriteAddress[] = [];

  // Préférences
  preferences: UserPreferences = {
    favoriteAddresses: [],
    defaultPaymentMethod: 'mobile_money',
    defaultVehicleType: 'voiture',
    recentSearches: []
  };

  // Statistiques
  stats = {
    totalRides: 24,
    totalSpent: 128500,
    averageRating: 4.8
  };

  // Abonnements
  private ridesSubscription: Subscription = new Subscription();
  private searchSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private rideService: RideService,
    private authService: Auth,
    private notificationService: NotificationService,
    private geolocationService: GeolocationService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      carOutline, timeOutline, locationOutline, flagOutline, cashOutline,
      cardOutline, star, starOutline, searchOutline, calendarOutline,
      bicycleOutline, busOutline, addOutline, personOutline, notificationsOutline,
      repeatOutline, heartOutline, settingsOutline, compassOutline, trendingUpOutline,
      airplaneOutline, trainOutline, chevronForwardOutline, homeOutline,
      businessOutline, ellipsisHorizontalOutline
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadRecentRides();
    this.loadPreferences();
    this.setupSearchListener();
  }

  ngOnDestroy() {
    if (this.ridesSubscription) this.ridesSubscription.unsubscribe();
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
  }

  // ================================
  // CHARGEMENT DES DONNÉES
  // ================================

  loadUserData() {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name || 'Passager';
      this.userAvatar = user.photo || 'assets/icon/default-avatar.svg';
    }
  }

  loadRecentRides(event?: any) {
    this.isLoading = true;
    const userId = this.authService.getUserId();

    if (userId) {
      this.ridesSubscription = this.rideService.getRides(Number(userId)).subscribe({
        next: (rides) => {
          this.recentRides = rides.slice(0, 3);
          this.calculateStats(rides);
          this.isLoading = false;
          if (event) event.target.complete();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors du chargement des courses:', err);
          if (event) event.target.complete();
        }
      });
    } else {
      // Données mock pour la démo
      this.loadMockData();
      this.isLoading = false;
      if (event) event.target.complete();
    }
  }

  loadMockData() {
    // Créer un objet qui correspond exactement à l'interface Ride
    const mockRide: Ride = {
      id: 1,
      
      client: {
        id: 101,
        name: 'Jean Dupont',
        email: 'jean@email.com',
        photo: 'assets/icon/default-avatar.svg',
        phone_number: '+237 612345678'
      },
      chauffeur: {
        id: 201,
        name: 'Mohamed Koné',
        photo: 'assets/icon/default-avatar.svg',
        phone_number: '+237 612345679',
        rating: 4.9,
        email:''
      },
      point_depart: { latitude: 3.8667, longitude: 11.5167 },
      point_arrivee: { latitude: 4.0500, longitude: 9.7000 },
      adresse_depart: 'Mvog-Mbi, Yaoundé',
      adresse_arrivee: 'Akwa, Douala',
      prix: 15000,
      distance_km: 210,
      duree_estimee: '03:30:00',
      statut: 'terminee',
      methode_paiement: 'mobile_money',
      est_payee: true,
      date_demande: new Date().toISOString(),
      date_acceptation: new Date().toISOString(),
      date_debut: new Date().toISOString(),
      date_fin: new Date().toISOString()
    };
    
    this.recentRides = [mockRide];
    
    // Mettre à jour les stats
    this.stats.totalRides = 1;
    this.stats.totalSpent = 15000;
  }

  calculateStats(rides: Ride[]) {
    this.stats.totalRides = rides.length;
    this.stats.totalSpent = rides
      .filter(r => r.statut === 'terminee')
      .reduce((sum, r) => sum + r.prix, 0);
    
    // Note moyenne par défaut (client_rating n'existe pas dans l'interface)
    this.stats.averageRating = 4.8;
  }

  // ================================
  // PRÉFÉRENCES UTILISATEUR
  // ================================

  loadPreferences() {
    // Charger depuis le localStorage
    const savedPrefs = localStorage.getItem('user_preferences');
    if (savedPrefs) {
      this.preferences = JSON.parse(savedPrefs);
      this.favoriteAddresses = this.preferences.favoriteAddresses;
    } else {
      // Préférences par défaut
      this.favoriteAddresses = [
        {
          id: '1',
          name: 'Maison',
          address: 'Mvog-Mbi, Yaoundé, Cameroun',
          latitude: 3.8667,
          longitude: 11.5167,
          icon: 'home-outline'
        },
        {
          id: '2',
          name: 'Bureau',
          address: 'Bonanjo, Douala, Cameroun',
          latitude: 4.0500,
          longitude: 9.7000,
          icon: 'business-outline'
        },
        {
          id: '3',
          name: 'Aéroport',
          address: 'Aéroport International, Douala',
          latitude: 4.0167,
          longitude: 9.7167,
          icon: 'airplane-outline'
        }
      ];
      this.preferences.favoriteAddresses = this.favoriteAddresses;
      this.savePreferences();
    }
  }

  savePreferences() {
    localStorage.setItem('user_preferences', JSON.stringify(this.preferences));
  }

  async addToFavorites(address: string, lat: number, lng: number) {
    const alert = await this.alertCtrl.create({
      header: 'Ajouter aux favoris',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nom (ex: Maison, Bureau)'
        }
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Ajouter',
          handler: (data) => {
            if (!data.name) {
              this.showToast('Veuillez entrer un nom', 'warning');
              return false;
            }

            const newFavorite: FavoriteAddress = {
              id: Date.now().toString(),
              name: data.name,
              address: address,
              latitude: lat,
              longitude: lng,
              icon: 'heart-outline'
            };

            this.favoriteAddresses.push(newFavorite);
            this.preferences.favoriteAddresses = this.favoriteAddresses;
            this.savePreferences();
            this.showToast('Adresse ajoutée aux favoris', 'success');
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  useFavoriteAddress(address: FavoriteAddress, type: 'depart' | 'arrivee') {
    // Naviguer vers la page de création avec l'adresse pré-remplie
    this.router.navigate(['/client/create-ride'], {
      state: {
        [type === 'depart' ? 'adresse_depart' : 'adresse_arrivee']: address.address,
        [`${type}Lat`]: address.latitude,
        [`${type}Lng`]: address.longitude
      }
    });
  }

  // ================================
  // RECHERCHE DE LIEUX
  // ================================

  setupSearchListener() {
    // Simuler la recherche pour la démo
    this.searchSubscription = new Observable(observer => {
      // Logique de recherche simulée
    }).pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe();
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value;

    if (this.searchQuery.length >= 3) {
      this.showSuggestions = true;
      // Simuler des suggestions
      this.searchSuggestions = [
        { description: `${this.searchQuery} - Mvog-Mbi, Yaoundé` },
        { description: `${this.searchQuery} - Bonanjo, Douala` },
        { description: `${this.searchQuery} - Akwa, Douala` }
      ];
    } else {
      this.showSuggestions = false;
      this.searchSuggestions = [];
    }
  }

  selectSuggestion(suggestion: any) {
    this.searchQuery = suggestion.description;
    this.showSuggestions = false;

    // Sauvegarder dans les recherches récentes
    this.preferences.recentSearches.unshift(suggestion.description);
    this.preferences.recentSearches = [...new Set(this.preferences.recentSearches)].slice(0, 5);
    this.savePreferences();

    // Naviguer vers la création de course
    this.router.navigate(['/client/create-ride'], {
      state: { adresse_depart: suggestion.description }
    });
  }

  // ================================
  // ACTIONS RAPIDES
  // ================================

  quickBook(destination: string) {
    this.router.navigate(['/client/create-ride'], {
      state: { adresse_arrivee: destination }
    });
  }

  repeatLastRide() {
    if (this.recentRides.length > 0) {
      const lastRide = this.recentRides[0];
      this.router.navigate(['/client/create-ride'], {
        state: {
          adresse_depart: lastRide.adresse_depart,
          adresse_arrivee: lastRide.adresse_arrivee
        }
      });
    }
  }

  // ================================
  // NAVIGATION
  // ================================

  goToBookRide() {
    this.router.navigate(['/passager/create-ride']);
  }

  goToRideDetail(rideId: number) {
    this.router.navigate(['/client/ride-tracking', rideId]);
  }

  goToTrips() {
    this.router.navigate(['/client/trips']);
  }

  goToProfile() {
    this.router.navigate(['/client/profile']);
  }

  goToNotifications() {
    this.router.navigate(['/client/notifications']);
  }

  goToSettings() {
    this.router.navigate(['/client/settings']);
  }

  // ================================
  // UTILITAIRES D'AFFICHAGE
  // ================================

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      en_attente: 'warning',
      acceptee: 'primary',
      en_cours: 'success',
      terminee: 'medium',
      annulee: 'danger'
    };
    return colors[status] || 'medium';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      en_attente: 'En attente',
      acceptee: 'Acceptée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée'
    };
    return texts[status] || status;
  }

  getVehicleIcon(type: string): string {
    const icons: Record<string, string> = {
      moto: 'bicycle-outline',
      voiture: 'car-outline',
      bus: 'bus-outline'
    };
    return icons[type] || 'car-outline';
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-FR') + ' FCFA';
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `Il y a ${hours}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  // ================================
  // ACTIONS UTILISATEUR
  // ================================

  async showRideOptions(ride: Ride) {
    const buttons = [];

    // Option pour noter (sans utiliser client_rating)
    if (ride.statut === 'terminee') {
      buttons.push({
        text: 'Noter cette course',
        handler: () => this.rateRide(ride.id, ride.chauffeur?.id || 0)
      });
    }

    buttons.push({
      text: 'Voir les détails',
      handler: () => this.goToRideDetail(ride.id)
    });

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

  rateRide(rideId: number, driverId: number) {
    this.router.navigate(['/rate-ride', rideId, driverId]);
  }

  async refreshData(event: any) {
    this.loadRecentRides(event);
  }

  // ================================
  // UTILITAIRES
  // ================================

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
  // homep.page.ts - Ajouter cette méthode
// goToBookRide() {
//   this.router.navigate(['/client/create-ride']);
// }
}
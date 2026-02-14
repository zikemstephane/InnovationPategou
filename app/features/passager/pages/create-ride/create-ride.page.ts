// create-ride.page.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonTextarea,
  IonIcon,
  IonButton,
  IonSpinner,
  IonLabel,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';

// CORRECTION IMPORTANTE - La bonne façon d'importer Google Maps
import { GoogleMap } from '@capacitor/google-maps';
import { Geolocation } from '@capacitor/geolocation';

import { RideService } from 'src/app/infrastructure/services/ride';
import { OfflineDbService } from 'src/app/infrastructure/services/offline-db-service';
import { SyncService } from 'src/app/infrastructure/services/sync-service';
import { CreateRideRequest, Point, Ride } from 'src/app/application/models/ride';
import { Auth } from 'src/app/infrastructure/services/auth/auth';

@Component({
  selector: 'app-create-ride',
  templateUrl: './create-ride.page.html',
  styleUrls: ['./create-ride.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonItem,
    IonInput,
    IonTextarea,
    IonIcon,
    IonButton,
    IonSpinner,
    IonLabel
  ]
})
export class CreateRidePage implements OnInit, OnDestroy {
  @ViewChild('map') mapElement!: ElementRef;

  rideForm: FormGroup;
  mapRef: GoogleMap | null = null; // Utiliser le type GoogleMap
  isCreating = false;
  estimatedPrice: number | null = null;
  suggestions: any[] = [];
  currentAddressField: 'depart' | 'arrivee' = 'depart';
  
  // Points géolocalisés
  departurePoint: Point | null = null;
  arrivalPoint: Point | null = null;

  // Préférences utilisateur
  private userId: number | null = null;
  private formSubscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private rideService: RideService,
    private offlineDb: OfflineDbService,
    private syncService: SyncService,
    private authService: Auth,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    const userIdStr = this.authService.getUserId();
    this.userId = userIdStr ? Number(userIdStr) : null;
    
    this.rideForm = this.fb.group({
      adresse_depart: ['', Validators.required],
      adresse_arrivee: ['', Validators.required],
      vehicleType: ['moto', Validators.required],
      instructions: [''],
      methode_paiement: ['especes', Validators.required]
    });

    // Écouter les changements pour estimer le prix
    this.formSubscription = this.rideForm.valueChanges.subscribe(() => {
      this.estimatePrice();
    });

    // Vérifier si des données sont passées en state (depuis home)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;
      if (state.adresse_depart) {
        this.rideForm.patchValue({ adresse_depart: state.adresse_depart });
      }
      if (state.adresse_arrivee) {
        this.rideForm.patchValue({ adresse_arrivee: state.adresse_arrivee });
      }
      if (state.departLat && state.departLng) {
        this.departurePoint = { latitude: state.departLat, longitude: state.departLng };
      }
      if (state.arriveeLat && state.arriveeLng) {
        this.arrivalPoint = { latitude: state.arriveeLat, longitude: state.arriveeLng };
      }
    }
  }

  async ngOnInit() {
    try {
      // Initialiser la base de données si ce n'est pas déjà fait
      await this.offlineDb.initializeDatabase();
      await this.initializeMap();
      await this.getCurrentLocation();
    } catch (error) {
      console.error('❌ Erreur ngOnInit:', error);
      this.showToast('Erreur lors de l\'initialisation', 'danger');
    }
  }

  ngOnDestroy() {
    if (this.mapRef) {
      try {
        this.mapRef.destroy();
      } catch (error) {
        console.error('❌ Erreur destruction carte:', error);
      }
    }
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  // ================================
  // GESTION DE LA CARTE
  // ================================

  async initializeMap() {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('❌ Élément map non trouvé');
        return;
      }

      // Convertir Point en LatLng pour Google Maps
      const center = this.departurePoint 
        ? { lat: this.departurePoint.latitude, lng: this.departurePoint.longitude }
        : { lat: 3.8667, lng: 11.5167 }; // Yaoundé par défaut

      // Créer la carte avec l'API correcte
      this.mapRef = await GoogleMap.create({
        id: 'create-ride-map',
        element: mapElement,
        apiKey: 'AIzaSyCrbY593deLu2Oic6xjs2BLN1UHmi2rBnQ',
        config: {
          center: center,
          zoom: 14,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }
      });
      
      // Ajouter un écouteur de clic sur la carte
      await this.mapRef.setOnMapClickListener((point: any) => {
        this.setMarker(point, 'depart');
      });

      // Si on a déjà des points, les afficher
      if (this.departurePoint) {
        await this.setMarker(this.departurePoint, 'depart');
      }
      if (this.arrivalPoint) {
        await this.setMarker(this.arrivalPoint, 'arrivee');
      }

    } catch (error) {
      console.error('❌ Erreur initialisation carte:', error);
      this.showToast('Erreur lors du chargement de la carte', 'danger');
    }
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      const point: Point = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      
      // Si pas de point de départ défini, utiliser la position actuelle
      if (!this.departurePoint && this.mapRef) {
        this.departurePoint = point;
        await this.mapRef.setCamera({
          coordinate: { lat: point.latitude, lng: point.longitude },
          zoom: 15
        });
        
        await this.getAddressFromCoordinates(point, 'depart');
        await this.setMarker(point, 'depart');
      }
      
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
      // Ne pas bloquer l'utilisateur si la géolocalisation échoue
      this.showToast('Impossible d\'obtenir votre position', 'warning');
    }
  }

  async useCurrentLocation() {
    await this.getCurrentLocation();
  }

  async getAddressFromCoordinates(point: Point, field: 'depart' | 'arrivee') {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${point.latitude},${point.longitude}&key=VOTRE_CLE_API&language=fr`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const address = data.results[0].formatted_address;
        this.rideForm.patchValue({
          [field === 'depart' ? 'adresse_depart' : 'adresse_arrivee']: address
        });
      }
    } catch (error) {
      console.error('❌ Erreur géocodage:', error);
    }
  }

  async setMarker(point: Point, type: 'depart' | 'arrivee') {
    if (!this.mapRef) return;

    try {
      const position = { lat: point.latitude, lng: point.longitude };

      // Ajouter un marqueur avec l'API correcte
      await this.mapRef.addMarker({
        coordinate: position,
        title: type === 'depart' ? 'Départ' : 'Arrivée',
        iconUrl: type === 'depart' ? 'assets/icon/marker-green.png' : 'assets/icon/marker-red.png',
        isFlat: true
      });

      if (type === 'depart') {
        this.departurePoint = point;
        await this.getAddressFromCoordinates(point, 'depart');
      } else {
        this.arrivalPoint = point;
        await this.getAddressFromCoordinates(point, 'arrivee');
      }

      // Ajuster la caméra pour voir tous les marqueurs
      if (this.departurePoint && this.arrivalPoint) {
        const bounds = {
          south: Math.min(this.departurePoint.latitude, this.arrivalPoint.latitude),
          north: Math.max(this.departurePoint.latitude, this.arrivalPoint.latitude),
          west: Math.min(this.departurePoint.longitude, this.arrivalPoint.longitude),
          east: Math.max(this.departurePoint.longitude, this.arrivalPoint.longitude)
        };
        
        await this.mapRef.setCamera({
          coordinate: {
            lat: (bounds.north + bounds.south) / 2,
            lng: (bounds.east + bounds.west) / 2
          },
          zoom: 12
        });
      }
    } catch (error) {
      console.error('❌ Erreur ajout marqueur:', error);
    }
  }

  // ================================
  // RECHERCHE D'ADRESSES
  // ================================

  async searchAddress(field: 'depart' | 'arrivee', event: any) {
    this.currentAddressField = field;
    const query = event.detail.value;
    
    if (query.length < 3) {
      this.suggestions = [];
      return;
    }

    try {
      // Vérifier d'abord dans le cache local
      const cached = await this.offlineDb.getCachedSearchResults(query);
      if (cached) {
        this.suggestions = cached;
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=VOTRE_CLE_API&language=fr&components=country:cm`
      );
      const data = await response.json();
      this.suggestions = data.predictions || [];
      
      // Mettre en cache les résultats
      if (this.suggestions.length > 0) {
        await this.offlineDb.cacheSearchResults(query, this.suggestions);
      }
    } catch (error) {
      console.error('❌ Erreur recherche adresse:', error);
    }
  }

  async selectSuggestion(suggestion: any) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=VOTRE_CLE_API`
      );
      const data = await response.json();
      
      if (data.result) {
        const location = data.result.geometry.location;
        const point: Point = {
          latitude: location.lat,
          longitude: location.lng
        };

        if (this.currentAddressField === 'depart') {
          this.departurePoint = point;
          this.rideForm.patchValue({ adresse_depart: suggestion.description });
        } else {
          this.arrivalPoint = point;
          this.rideForm.patchValue({ adresse_arrivee: suggestion.description });
        }

        this.suggestions = [];
        
        // Ajouter un marqueur sur la carte
        await this.setMarker(point, this.currentAddressField);
      }
    } catch (error) {
      console.error('❌ Erreur détails lieu:', error);
    }
  }

  // ================================
  // SÉLECTIONS
  // ================================

  selectVehicle(type: string) {
    this.rideForm.patchValue({ vehicleType: type });
  }

  selectPayment(method: string) {
    this.rideForm.patchValue({ methode_paiement: method });
  }

  // ================================
  // CALCULS
  // ================================

  estimatePrice() {
    if (this.departurePoint && this.arrivalPoint) {
      const distance = this.calculateDistance(
        this.departurePoint,
        this.arrivalPoint
      );
      
      const rates = {
        moto: 500,
        voiture: 800,
        bus: 1200
      };
      
      const vehicle = this.rideForm.get('vehicleType')?.value as keyof typeof rates;
      const basePrice = 1000;
      
      this.estimatedPrice = Math.round(basePrice + (distance * rates[vehicle]));
    }
  }

  calculateDistance(point1: Point, point2: Point): number {
    const R = 6371;
    const dLat = this.deg2rad(point2.latitude - point1.latitude);
    const dLon = this.deg2rad(point2.longitude - point1.longitude);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.latitude)) * Math.cos(this.deg2rad(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.rideForm.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  // ================================
  // CRÉATION DE LA COURSE (AVEC SQLITE)
  // ================================

  async createRide() {
    if (this.rideForm.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Informations invalides',
        message: 'Veuillez remplir tous les champs obligatoires.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.departurePoint || !this.arrivalPoint) {
      const alert = await this.alertCtrl.create({
        header: 'Points manquants',
        message: 'Veuillez sélectionner les points de départ et d\'arrivée sur la carte.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Création de la course...',
      spinner: 'crescent'
    });
    await loading.present();

    // Préparer les données de la course
    const rideData: any = {
      id: Date.now(), // ID temporaire
      client_id: this.userId || 101,
      client: {
        id: this.userId || 101,
        name: 'Client',
        email: '',
        photo: 'assets/icon/default-avatar.svg'
      },
      chauffeur: null,
      point_depart: this.departurePoint,
      point_arrivee: this.arrivalPoint,
      adresse_depart: this.rideForm.get('adresse_depart')?.value,
      adresse_arrivee: this.rideForm.get('adresse_arrivee')?.value,
      prix: this.estimatedPrice || 0,
      distance_km: this.estimatedPrice ? 
        Math.round((this.estimatedPrice - 1000) / 
        (this.rideForm.get('vehicleType')?.value === 'moto' ? 500 : 
         this.rideForm.get('vehicleType')?.value === 'voiture' ? 800 : 1200) * 10) / 10 : 0,
      duree_estimee: '00:30:00',
      statut: 'en_attente',
      methode_paiement: this.rideForm.get('methode_paiement')?.value,
      est_payee: false,
      instructions: this.rideForm.get('instructions')?.value,
      date_demande: new Date().toISOString()
    };

    try {
      // Sauvegarder dans la base de données locale
      await this.offlineDb.saveRide(rideData);
      
      // Essayer de synchroniser si en ligne
      if (this.syncService.isConnected()) {
        // Ne pas attendre la synchronisation
        this.syncService.syncData().catch(err => 
          console.error('Erreur synchronisation:', err)
        );
      }

      loading.dismiss();
      this.isCreating = false;
      
      const alert = await this.alertCtrl.create({
        header: '✅ Succès !',
        message: this.syncService.isConnected() 
          ? 'Votre course a été créée. Un chauffeur vous sera bientôt assigné.'
          : 'Votre course a été enregistrée en mode hors-ligne. Elle sera synchronisée dès que vous serez connecté.',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.router.navigate(['/client/ride-tracking', rideData.id]);
          }
        }]
      });
      await alert.present();

    } catch (error) {
      loading.dismiss();
      this.isCreating = false;
      console.error('❌ Erreur lors de la création de la course:', error);
      
      const alert = await this.alertCtrl.create({
        header: '❌ Erreur',
        message: 'Impossible de créer la course. Veuillez réessayer.',
        buttons: ['OK']
      });
      await alert.present();
    }
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

  goBack() {
    this.router.navigate(['/client/home']);
  }
}
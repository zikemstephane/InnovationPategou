import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  IonInput,
  IonSpinner,
  IonBadge,
  AlertController,
  ToastController, IonChip
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  listOutline,
  personOutline,
  star,
  carOutline,
  locationOutline,
  cardOutline,
  shieldCheckmarkOutline,
  playOutline,
  stopCircleOutline,
  callOutline,
  chatbubbleOutline,
  cashOutline,
  timeOutline,
  calendarOutline,
  mapOutline,
  flagOutline, resizeOutline, documentTextOutline, closeOutline, checkmarkCircleOutline
} from 'ionicons/icons';

// Mock data des courses (identique à la page rides)
const MOCK_RIDES = {
  1: {
    id: 1,
    client: {
      id: 101,
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      phone_number: '+225 01 23 45 67',
      photo: 'assets/icon/default-avatar.svg',
      rating: 4.8
    },
    chauffeur: {
      id: 201,
      name: 'Mohamed Koné',
      email: 'mohamed.kone@email.com',
      phone_number: '+225 07 89 01 23',
      photo: 'assets/icon/default-avatar.svg',
      rating: 4.9
    },
    vehicle: {
      id: 301,
      marque: 'Toyota',
      modele: 'Corolla',
      type_vehicule: 'voiture',
      immatriculation: 'AB-123-CD',
      couleur: 'Blanc',
      capacite: 4,
      photo: 'assets/icon/car.svg'
    },
    point_depart: { latitude: 5.3300, longitude: -4.0300 },
    point_arrivee: { latitude: 5.3500, longitude: -4.0100 },
    adresse_depart: '15 Avenue Chardy, Plateau, Abidjan',
    adresse_arrivee: '50 Boulevard de Marseille, Marcory, Abidjan',
    prix: 4500,
    instructions: 'Sonner à l\'interphone, code 1234',
    distance_km: 8.5,
    duree_estimee: '00:25:00',
    duree_reelle: '00:28:00',
    statut: 'en_cours',
    methode_paiement: 'mobile_money',
    est_payee: false,
    safe_ride_code: '1234',
    date_demande: new Date().toISOString(),
    date_acceptation: new Date().toISOString(),
    date_debut: new Date().toISOString()
  },
  2: {
    id: 2,
    client: {
      id: 102,
      name: 'Marie Kouassi',
      email: 'marie.kouassi@email.com',
      phone_number: '+225 05 43 21 09',
      photo: 'assets/icon/default-avatar.svg',
      rating: 4.7
    },
    chauffeur: {
      id: 202,
      name: 'Amadou Touré',
      email: 'amadou.toure@email.com',
      phone_number: '+225 08 76 54 32',
      photo: 'assets/icon/default-avatar.svg',
      rating: 4.8
    },
    vehicle: {
      id: 302,
      marque: 'Honda',
      modele: 'CB 125',
      type_vehicule: 'moto',
      immatriculation: 'AB-456-CD',
      couleur: 'Rouge',
      capacite: 2,
      photo: 'assets/icon/motorcycle.svg'
    },
    point_depart: { latitude: 5.3400, longitude: -4.0250 },
    point_arrivee: { latitude: 5.3600, longitude: -4.0150 },
    adresse_depart: '25 Rue des Jardins, Cocody, Abidjan',
    adresse_arrivee: '10 Avenue Noguès, Plateau, Abidjan',
    prix: 2500,
    instructions: 'Appeler en arrivant',
    distance_km: 5.2,
    duree_estimee: '00:15:00',
    statut: 'acceptee',
    methode_paiement: 'especes',
    est_payee: false,
    safe_ride_code: '5678',
    date_demande: new Date().toISOString(),
    date_acceptation: new Date().toISOString()
  },
  3: {
    id: 3,
    client: {
      id: 103,
      name: 'Sophie Yao',
      email: 'sophie.yao@email.com',
      phone_number: '+225 02 46 80 13',
      photo: 'assets/icon/default-avatar.svg',
      rating: 5.0
    },
    chauffeur: {
      id: 203,
      name: 'Ibrahim Cissé',
      email: 'ibrahim.cisse@email.com',
      phone_number: '+225 09 87 65 43',
      photo: 'assets/icon/default-avatar.svg',
      rating: 4.9
    },
    vehicle: {
      id: 303,
      marque: 'Mercedes',
      modele: 'Sprinter',
      type_vehicule: 'bus',
      immatriculation: 'AB-789-CD',
      couleur: 'Blanc',
      capacite: 15,
      photo: 'assets/icon/bus.svg'
    },
    point_depart: { latitude: 5.3700, longitude: -4.0350 },
    point_arrivee: { latitude: 5.3900, longitude: -4.0200 },
    adresse_depart: 'Gare routière d\'Adjamé, Abidjan',
    adresse_arrivee: 'Université de Cocody, Abidjan',
    prix: 15000,
    instructions: 'Attendre au parking',
    distance_km: 12.8,
    duree_estimee: '00:35:00',
    duree_reelle: '00:38:00',
    statut: 'terminee',
    methode_paiement: 'wave',
    est_payee: true,
    safe_ride_code: '9012',
    date_demande: new Date(Date.now() - 7200000).toISOString(),
    date_acceptation: new Date(Date.now() - 7000000).toISOString(),
    date_debut: new Date(Date.now() - 6800000).toISOString(),
    date_fin: new Date(Date.now() - 6000000).toISOString()
  }
};

@Component({
  selector: 'app-ride-detail',
  standalone: true,
  imports: [IonChip,
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonInput,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
    IonSpinner,
    IonBadge
  ],
  templateUrl: './ride-detail.page.html',
  styleUrls: ['./ride-detail.page.scss'],
})
export class RideDetailPage implements OnInit {
  rideId: number | null = null;
  ride: any = null;
  isLoading = true;

  // Pour simuler le rôle (à remplacer par la vraie auth)
  // currentUserRole: 'client' | 'chauffeur' = 'client'; // Vue client
  currentUserRole: 'client' | 'chauffeur' = 'chauffeur'; // Vue chauffeur

  // Code de sécurité
  enteredCode: string = '';
  isStartingRide = false;
  isEndingRide = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ listOutline, star, callOutline, chatbubbleOutline, mapOutline, locationOutline, flagOutline, resizeOutline, timeOutline, documentTextOutline, shieldCheckmarkOutline, playOutline, stopCircleOutline, closeOutline, carOutline, checkmarkCircleOutline, personOutline, cardOutline, cashOutline, calendarOutline });
  }

  ngOnInit() {
    const rideIdParam = this.route.snapshot.paramMap.get('rideId');

    if (rideIdParam) {
      this.rideId = Number(rideIdParam);
      this.loadRideDetails();
    } else {
      this.showError('ID de course manquant');
      this.goToRidesList();
    }
  }

  // ================================
  // LOAD DETAILS (MOCK)
  // ================================

  loadRideDetails() {
    if (!this.rideId) return;

    this.isLoading = true;

    // Simuler un délai de chargement
    setTimeout(() => {
      this.ride = MOCK_RIDES[this.rideId as keyof typeof MOCK_RIDES];

      if (this.ride) {
        this.isLoading = false;
      } else {
        this.showError('Course non trouvée');
        this.isLoading = false;
        this.goToRidesList();
      }
    }, 800);
  }

  // ================================
  // ACTIONS (adaptées au rôle)
  // ================================

  async startRide() {
    if (this.currentUserRole !== 'chauffeur') {
      this.showError('Seul le chauffeur peut démarrer la course');
      return;
    }

    if (!this.ride || this.ride.statut !== 'acceptee') {
      this.showError('Cette course ne peut pas être démarrée');
      return;
    }

    // Vérifier le code de sécurité
    if (this.enteredCode !== this.ride.safe_ride_code) {
      this.showError('Code de sécurité incorrect');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Démarrer la course',
      message: 'Confirmez-vous le début de la course ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Démarrer',
          handler: () => {
            this.executeStartRide();
          }
        }
      ]
    });
    await alert.present();
  }

  executeStartRide() {
    this.isStartingRide = true;

    // Simuler le démarrage
    setTimeout(() => {
      this.ride.statut = 'en_cours';
      this.ride.date_debut = new Date().toISOString();
      this.isStartingRide = false;
      this.showToast('Course démarrée avec succès', 'success');
      this.enteredCode = '';
    }, 1500);
  }

  async endRide() {
    if (this.currentUserRole !== 'chauffeur') {
      this.showError('Seul le chauffeur peut terminer la course');
      return;
    }

    if (!this.ride || this.ride.statut !== 'en_cours') {
      this.showError('Cette course n\'est pas en cours');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Terminer la course',
      message: 'Confirmez-vous la fin de la course ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Terminer',
          handler: () => {
            this.executeEndRide();
          }
        }
      ]
    });
    await alert.present();
  }

  executeEndRide() {
    this.isEndingRide = true;

    // Simuler la fin de course
    setTimeout(() => {
      this.ride.statut = 'terminee';
      this.ride.date_fin = new Date().toISOString();
      this.ride.est_payee = true;
      this.isEndingRide = false;
      this.showToast('Course terminée avec succès', 'success');
      this.presentRideSummary();
    }, 1500);
  }

  async cancelRide() {
    if (this.currentUserRole !== 'chauffeur') {
      this.showError('Seul le chauffeur peut annuler la course');
      return;
    }

    if (this.ride.statut === 'terminee' || this.ride.statut === 'annulee') {
      this.showError('Cette course ne peut plus être annulée');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Annuler la course',
      message: 'Voulez-vous vraiment annuler cette course ?',
      inputs: [
        {
          name: 'reason',
          type: 'text',
          placeholder: 'Raison de l\'annulation (optionnel)'
        }
      ],
      buttons: [
        { text: 'Non', role: 'cancel' },
        {
          text: 'Oui, annuler',
          handler: () => {
            this.ride.statut = 'annulee';
            this.showToast('Course annulée', 'warning');
            setTimeout(() => {
              this.goToRidesList();
            }, 2000);
          }
        }
      ]
    });
    await alert.present();
  }

  async contactClient() {
    if (!this.ride?.client?.phone_number) {
      this.showError('Numéro non disponible');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Contacter le client',
      message: `Appeler ${this.ride.client.name} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Appeler',
          handler: () => {
            this.showToast('Appel en cours...', 'primary');
          }
        }
      ]
    });
    await alert.present();
  }

  async contactDriver() {
    if (!this.ride?.chauffeur?.phone_number) {
      this.showError('Numéro non disponible');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Contacter le chauffeur',
      message: `Appeler ${this.ride.chauffeur.name} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Appeler',
          handler: () => {
            this.showToast('Appel en cours...', 'primary');
          }
        }
      ]
    });
    await alert.present();
  }

  // ================================
  // AFFICHAGE
  // ================================

  async presentRideSummary() {
    const alert = await this.alertCtrl.create({
      header: '✅ Course terminée',
      message: `
        <div style="text-align: center">
          <p>Merci d'avoir voyagé avec MoovCity !</p>
          <p><strong>Distance:</strong> ${this.ride.distance_km} km</p>
          <p><strong>Durée:</strong> ${this.formatDuration(this.ride.duree_reelle || '00:30:00')}</p>
          <p><strong>Prix:</strong> ${this.ride.prix} XOF</p>
        </div>
      `,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.goToRidesList();
          }
        }
      ]
    });
    await alert.present();
  }

  formatDuration(duration: string): string {
    if (!duration) return 'N/A';
    return duration;
  }

  getStatusColor(): string {
    const colors: Record<string, string> = {
      en_attente: 'warning',
      acceptee: 'primary',
      en_cours: 'success',
      terminee: 'medium',
      annulee: 'danger'
    };
    return colors[this.ride?.statut || 'en_attente'];
  }

  getStatusText(): string {
    const texts: Record<string, string> = {
      en_attente: 'En attente',
      acceptee: 'Acceptée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée'
    };
    return texts[this.ride?.statut || 'en_attente'];
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      especes: 'Espèces',
      carte: 'Carte',
      mobile_money: 'Mobile Money',
      wave: 'Wave'
    };
    return labels[method] || method;
  }

  getVehicleIcon(): string {
    const icons: Record<string, string> = {
      moto: 'bicycle-outline',
      voiture: 'car-outline',
      bus: 'bus-outline'
    };
    return icons[this.ride?.vehicle?.type_vehicule || 'voiture'];
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

  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Erreur',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goToRidesList() {
    if (this.currentUserRole === 'chauffeur') {
      this.router.navigate(['/driver/rides']);
    } else {
      this.router.navigate(['/client/rides']);
    }
  }

  goBack() {
    this.goToRidesList();
  }
}
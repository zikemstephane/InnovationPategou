import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonModal,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';

// Mock data des courses
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
    instructions: 'Sonner à l\'interphone',
    distance_km: 8.5,
    duree_estimee: '00:25:00',
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
    distance_km: 5.2,
    duree_estimee: '00:15:00',
    statut: 'acceptee',
    methode_paiement: 'especes',
    est_payee: false,
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
    statut: 'terminee',
    methode_paiement: 'wave',
    est_payee: true,
    date_demande: new Date(Date.now() - 7200000).toISOString(),
    date_acceptation: new Date(Date.now() - 7000000).toISOString(),
    date_debut: new Date(Date.now() - 6800000).toISOString(),
    date_fin: new Date(Date.now() - 6000000).toISOString()
  }
};

@Component({
  selector: 'app-ride-tracking',
  templateUrl: './ride-tracking.page.html',
  styleUrls: ['./ride-tracking.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonModal
  ]
})
export class RideTrackingPage implements OnInit {
  ride: any = null;
  rideId: number;
  isLoading = true;
  
  // Pour simuler le rôle (à remplacer par la vraie auth plus tard)
  // Changer cette valeur pour tester les deux rôles
  currentUserRole: 'client' | 'chauffeur' = 'client'; // Ici c'est le client qui suit sa course
  // currentUserRole: 'client' | 'chauffeur' = 'chauffeur'; // Décommenter pour tester chauffeur

  // Informations sur l'utilisateur connecté
  get currentUser() {
    return this.currentUserRole === 'client' ? this.ride?.client : this.ride?.chauffeur;
  }

  get otherUser() {
    return this.currentUserRole === 'client' ? this.ride?.chauffeur : this.ride?.client;
  }

  // État
  showContactModal = false;
  etaMinutes = 15;
  distanceKm = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    this.rideId = +this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit() {
    this.loadRide();
  }

  // ===============================
  // CHARGEMENT DES DONNÉES
  // ===============================

  loadRide() {
    this.isLoading = true;
    
    setTimeout(() => {
      this.ride = MOCK_RIDES[this.rideId as keyof typeof MOCK_RIDES] || MOCK_RIDES[1];
      
      if (this.ride) {
        this.calculateDistance();
        this.isLoading = false;
      } else {
        this.showError('Course non trouvée');
        this.isLoading = false;
      }
    }, 1000);
  }

  calculateDistance() {
    if (this.ride?.distance_km) {
      this.distanceKm = this.ride.distance_km;
    } else {
      this.distanceKm = 8.5;
    }
  }

  // ===============================
  // ACTIONS (adaptées au rôle)
  // ===============================

  async startRide() {
    if (this.currentUserRole !== 'chauffeur') {
      this.showError('Seul le chauffeur peut démarrer la course');
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
            this.ride.statut = 'en_cours';
            this.ride.date_debut = new Date().toISOString();
            this.showToast('Course démarrée', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  async completeRide() {
    if (this.currentUserRole !== 'chauffeur') {
      this.showError('Seul le chauffeur peut terminer la course');
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
            this.ride.statut = 'terminee';
            this.ride.date_fin = new Date().toISOString();
            this.showToast('Course terminée', 'success');
            this.presentRideSummary();
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelRide() {
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
          handler: (data) => {
            this.ride.statut = 'annulee';
            this.showToast('Course annulée', 'warning');
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 2000);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // Contact selon le rôle
  async contactOther() {
    const other = this.otherUser;
    if (!other?.phone_number) {
      this.showError('Numéro de téléphone non disponible');
      return;
    }
    
    const role = this.currentUserRole === 'client' ? 'chauffeur' : 'client';
    
    const alert = await this.alertCtrl.create({
      header: `Appeler le ${role}`,
      message: `Voulez-vous appeler ${other.name} au ${other.phone_number} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Appeler',
          handler: () => {
            this.showToast(`Appel à ${other.name}...`, 'primary');
          }
        }
      ]
    });
    await alert.present();
  }

  // ===============================
  // AFFICHAGE
  // ===============================

  async presentRideSummary() {
    const alert = await this.alertCtrl.create({
      header: '✅ Course terminée',
      message: `
        <div style="text-align: center">
          <p>Merci d'avoir voyagé avec MoovCity !</p>
          <p><strong>Distance:</strong> ${this.distanceKm} km</p>
          <p><strong>Prix:</strong> ${this.ride?.prix || 0} XOF</p>
        </div>
      `,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/home']);
          }
        }
      ]
    });
    await alert.present();
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

  getStatusIcon(): string {
    const icons: Record<string, string> = {
      en_attente: 'time-outline',
      acceptee: 'checkmark-circle-outline',
      en_cours: 'car-outline',
      terminee: 'flag-outline',
      annulee: 'close-circle-outline'
    };
    return icons[this.ride?.statut || 'en_attente'];
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

  // ===============================
  // MESSAGES PERSONNALISÉS
  // ===============================

  getWelcomeMessage(): string {
    if (this.currentUserRole === 'client') {
      return `Votre chauffeur ${this.ride?.chauffeur?.name} arrive`;
    } else {
      return `Course pour ${this.ride?.client?.name}`;
    }
  }

  getActionButtonText(): string {
    if (this.currentUserRole === 'chauffeur') {
      switch (this.ride?.statut) {
        case 'acceptee': return 'Démarrer la course';
        case 'en_cours': return 'Terminer la course';
        default: return '';
      }
    }
    return '';
  }

  // ===============================
  // UTILITAIRES
  // ===============================

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

  goBack() {
    this.router.navigate(['/home']);
  }

  // Actions du modal de contact
  sendMessage() {
    this.showToast('Fonctionnalité de messagerie à venir', 'primary');
    this.showContactModal = false;
  }

  shareLocation() {
    this.showToast('Partage de position à venir', 'primary');
    this.showContactModal = false;
  }
}
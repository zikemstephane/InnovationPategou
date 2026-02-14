import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonRefresher,
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
  IonSpinner,
  IonProgressBar,
  IonRefresherContent,
  IonChip,
  IonModal
} from '@ionic/angular/standalone';

import { AlertController, ToastController } from '@ionic/angular';

import { Ride } from 'src/app/application/models/ride';
import { RideService } from 'src/app/infrastructure/services/ride';
import { NotificationService } from 'src/app/infrastructure/services/notification';
import { Auth } from 'src/app/infrastructure/services/auth/auth';

interface FilterOption {
  label: string;
  value: string;
  icon: string;
  active: boolean;
}

interface GroupedRides {
  date: string;
  rides: Ride[];
}

@Component({
  selector: 'app-rides',
  templateUrl: './rides.page.html',
  styleUrls: ['./rides.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
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
    IonSpinner,
    IonProgressBar,
    IonChip,
    IonModal
  ],
})
export class RidesPage implements OnInit, OnDestroy {
  // Données
  rides: Ride[] = [];
  filteredRides: Ride[] = [];
  groupedRides: GroupedRides[] = [];
  
  // États
  isLoading = false;
  isRefreshing = false;
  activeFilter = 'all';
  showFilterModal = false;
  
  // Filtres
  filters: FilterOption[] = [
    { label: 'Toutes', value: 'all', icon: 'apps-outline', active: true },
    { label: 'En attente', value: 'en_attente', icon: 'time-outline', active: false },
    { label: 'Acceptées', value: 'acceptee', icon: 'checkmark-circle-outline', active: false },
    { label: 'En cours', value: 'en_cours', icon: 'car-outline', active: false },
    { label: 'Terminées', value: 'terminee', icon: 'flag-outline', active: false },
    { label: 'Annulées', value: 'annulee', icon: 'close-circle-outline', active: false }
  ];

  // Statistiques
  stats = {
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  };

  private ridesSubscription?: Subscription;

  constructor(
    private router: Router,
    private rideService: RideService,
    private notificationService: NotificationService,
    private authService: Auth,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.loadRides();
  }

  ngOnDestroy() {
    this.ridesSubscription?.unsubscribe();
  }

  // -----------------------------
  // Chargement des courses
  // -----------------------------
  loadRides(event?: any) {
    this.isLoading = true;
    const driverId = this.authService.getUserId();

    if (!driverId) {
      this.isLoading = false;
      this.showToast('ID chauffeur non trouvé', 'danger');
      event?.target?.complete();
      return;
    }

    this.ridesSubscription = this.rideService
      .get_by_chauffeur(Number(driverId))
      .subscribe({
        next: (rides) => {
          this.rides = rides;
          this.calculateStats();
          this.applyFilter(this.activeFilter);
          this.isLoading = false;
          this.isRefreshing = false;
          event?.target?.complete();
        },
        error: (err) => {
          this.handleError(err, 'Erreur lors du chargement des courses.');
          event?.target?.complete();
        }
      });
  }

  // -----------------------------
  // Calcul des statistiques
  // -----------------------------
  private calculateStats() {
    this.stats = {
      total: this.rides.length,
      pending: this.rides.filter(r => r.statut === 'en_attente').length,
      completed: this.rides.filter(r => r.statut === 'terminee').length,
      cancelled: this.rides.filter(r => r.statut === 'annulee').length
    };
  }

  // -----------------------------
  // Filtrage
  // -----------------------------
  applyFilter(filterValue: string) {
    this.activeFilter = filterValue;
    this.filters.forEach(f => f.active = f.value === filterValue);
    
    if (filterValue === 'all') {
      this.filteredRides = [...this.rides];
    } else {
      this.filteredRides = this.rides.filter(r => r.statut === filterValue);
    }
    
    this.groupRidesByDate();
    this.showFilterModal = false;
  }

  resetFilter() {
    this.applyFilter('all');
  }

  getFilterLabel(filterValue: string): string {
    return this.filters.find(f => f.value === filterValue)?.label || '';
  }

  // -----------------------------
  // Groupement par date
  // -----------------------------
  private groupRidesByDate() {
    const groups = new Map<string, Ride[]>();
    
    this.filteredRides.forEach(ride => {
      const date = new Date(ride.date_demande).toDateString();
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(ride);
    });

    this.groupedRides = Array.from(groups.entries())
      .map(([date, rides]) => ({
        date,
        rides: rides.sort((a, b) => 
          new Date(b.date_demande).getTime() - new Date(a.date_demande).getTime()
        )
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // -----------------------------
  // Gestion centralisée erreurs
  // -----------------------------
  private handleError(error: any, message = 'Une erreur est survenue.') {
    console.error('RidesPage Error:', error);
    this.isLoading = false;
    this.isRefreshing = false;
    this.showToast(message, 'danger');
  }

  // -----------------------------
  // Actions sur les courses
  // -----------------------------
  async acceptRide(rideId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Accepter la course',
      message: 'Êtes-vous sûr de vouloir accepter cette course ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Accepter',
          cssClass: 'success',
          handler: () => {
            const driverId = this.authService.getUserId();
            if (!driverId) return;

            this.rideService
              .acceptRide(rideId, Number(driverId))
              .subscribe({
                next: () => {
                  this.showToast('Course acceptée avec succès !', 'success');
                  this.goToRideDetail(rideId, 'start');
                },
                error: (err) => {
                  this.handleError(err, 'Impossible d’accepter la course.');
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  async declineRide(rideId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Refuser la course',
      message: 'Êtes-vous sûr de vouloir refuser cette course ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Refuser',
          cssClass: 'danger',
          handler: () => {
            const driverId = this.authService.getUserId();
            if (!driverId) return;

            this.rideService
              .declineRide(rideId, Number(driverId))
              .subscribe({
                next: () => {
                  this.showToast('Course refusée.', 'warning');
                  this.loadRides();
                },
                error: (err) => {
                  this.handleError(err, 'Impossible de refuser la course.');
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  async startRide(rideId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Démarrer la course',
      message: 'Confirmez le début de la course',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Démarrer',
          handler: () => {
            // Appeler le service pour démarrer la course
            this.showToast('Course démarrée', 'success');
            this.goToRideDetail(rideId, 'track');
          }
        }
      ]
    });
    await alert.present();
  }

  async completeRide(rideId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Terminer la course',
      message: 'Confirmez la fin de la course',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Terminer',
          handler: () => {
            // Appeler le service pour terminer la course
            this.showToast('Course terminée', 'success');
            this.loadRides();
          }
        }
      ]
    });
    await alert.present();
  }

  // -----------------------------
  // Navigation
  // -----------------------------
  goToRideDetail(rideId: number, action: string) {
    this.router.navigate(['/driver/rides', rideId], {
      state: { action }
    });
  }

  createRide() {
    this.router.navigate(['/driver/rides/create']);
  }

  goOnline() {
    this.router.navigate(['/driver/home'], {
      queryParams: { goOnline: true }
    });
  }

  // -----------------------------
  // Helpers d'affichage
  // -----------------------------
  getStatusColor(status: string): string {
    switch (status) {
      case 'en_attente': return 'warning';
      case 'acceptee': return 'primary';
      case 'en_cours': return 'success';
      case 'terminee': return 'medium';
      case 'annulee': return 'danger';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'acceptee': return 'Acceptée';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'en_attente': return 'status-warning';
      case 'acceptee': return 'status-primary';
      case 'en_cours': return 'status-success';
      case 'terminee': return 'status-medium';
      case 'annulee': return 'status-danger';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'en_attente': return 'time-outline';
      case 'acceptee': return 'checkmark-circle-outline';
      case 'en_cours': return 'car-outline';
      case 'terminee': return 'flag-outline';
      case 'annulee': return 'close-circle-outline';
      default: return 'help-outline';
    }
  }

  formatDate(date: string): string {
    const rideDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (rideDate.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (rideDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return rideDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  // -----------------------------
  // Toast
  // -----------------------------
  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // -----------------------------
  // Pull to refresh
  // -----------------------------
  doRefresh(event: any) {
    this.isRefreshing = true;
    this.loadRides(event);
  }
}
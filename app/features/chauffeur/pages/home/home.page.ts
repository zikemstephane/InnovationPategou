import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError, combineLatest, Subscription } from 'rxjs';
import { catchError, map, tap, finalize, switchMap } from 'rxjs/operators';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonThumbnail,
  IonLabel,
  IonItem,
  IonList,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonProgressBar
} from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeAgoPipe } from 'src/app/core/pipes/time-ago.pipe'; // Importer le pipe

import { Ride } from 'src/app/application/models/ride';
import { RideService } from 'src/app/infrastructure/services/ride';
import { DriverService } from 'src/app/infrastructure/services/driver';
import { NotificationService } from 'src/app/infrastructure/services/notification';
import { Auth } from 'src/app/infrastructure/services/auth/auth';
import { Earnings } from 'src/app/infrastructure/services/driver'; // Importer l'interface corrigée

import { DriverStats } from 'src/app/infrastructure/services/driver';
import { DriverProfile } from 'src/app/application/models/driver-profile.model';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TimeAgoPipe,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonThumbnail, IonLabel, IonItem, IonList,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonProgressBar
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {

  // --- État du composant ---
  isOnline = false;
  isNotificationExpanded = false;
  driverProfile: DriverProfile | null = null;
  isLoading = true;
  earnings: Earnings = { today: 0, thisWeek: 0, thisMonth: 0 };
  stats: DriverStats | null = null;
  recentRides: Ride[] = [];
  unreadNotifications: any[] = [];
  unreadCount = 0;

  // --- Abonnables pour la gestion du cycle de vie ---
  private ridesSubscription: Subscription = new Subscription();
  private notificationSubscription: Subscription= new Subscription();
  private driverProfileSubscription: Subscription= new Subscription();
  private earningsSubscription: Subscription= new Subscription();
  private statsSubscription: Subscription= new Subscription();

  constructor(
    private router: Router,
    private rideService: RideService,
    private driverService: DriverService,
    private notificationService: NotificationService,
    private authService: Auth
  ) {
    addIcons({notificationsOutline})
  }

  ngOnInit() {
    this.loadDriverData();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy() {
    if (this.ridesSubscription) {
      this.ridesSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.driverProfileSubscription) {
      this.driverProfileSubscription.unsubscribe();
    }
    if (this.earningsSubscription) {
      this.earningsSubscription.unsubscribe();
    }
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }

  // --- Chargement des données avec Fallback ---
  // loadDriverData() {
  //   const driverId = this.authService.getUserId();
  //   if (!driverId) {
  //     console.warn('ID du chauffeur non trouvé. Utilisation des données mock.');
  //     this.isLoading = false;
  //     // Assigner les données mock directement si l'utilisateur n'est pas connecté
  //     this.driverProfile = null;
  //     this.recentRides = [];
  //     this.earnings = { today: 0, thisWeek: 0, thisMonth: 0 };
  //     this.stats = null;
  //     return;
  //   }

  //   this.isLoading = true;
    
  //   this.driverProfileSubscription = combineLatest([
  //     this.driverService.getProfile(Number(driverId)),
  //     this.rideService.get_by_chauffeur(Number(driverId)),
  //     this.driverService.getEarnings(Number(driverId)),
  //     this.driverService.getStats(Number(driverId))
  //   ]).pipe(
  //     catchError((err) => {
  //       console.error('Erreur lors du chargement des données du chauffeur. Utilisation des données mock.', err);
  //       // Retourner un Observable avec les données mock en cas d'erreur
  //       return of({
  //         profile: null, // Profil sera null en cas d'erreur
  //         rides: [],
  //         earnings: { day: 0, week: 0, month: 0 },
  //         stats: null
  //       });
  //     })
  //   ).subscribe({
  //     next: ([profile, rides, earnings, stats]) => {
  //       this.driverProfile = profile;
  //       this.recentRides = rides.slice(0, 3);
  //       this.earnings = earnings;
  //       this.stats = stats;
  //       this.isOnline = profile ? profile.est_en_ligne : false;
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       // Le catchError dans le pipe gère déjà l'erreur, mais on peut ajouter une logique ici si nécessaire
  //       console.error('Erreur inattendue dans le chargement des données.', err);
  //       this.isLoading = false;
  //     }
  //   });
  // }
loadDriverData() {
  const driverId = this.authService.getUserId();
  if (!driverId) {
    console.warn('ID du chauffeur non trouvé. Utilisation des données mock.');
    this.isLoading = false;
    // Assigner les données mock directement si l'utilisateur n'est pas connecté
    this.driverProfile = null;
    this.recentRides = [];
    this.earnings = { today: 0, thisWeek: 0, thisMonth: 0 };
    this.stats = null;
    return;
  }

  this.isLoading = true;
  
  this.driverProfileSubscription = combineLatest([
    this.driverService.getProfile(Number(driverId)).pipe(catchError(() => of(null))),
    this.rideService.get_by_chauffeur(Number(driverId)).pipe(catchError(() => of([]))),
    this.driverService.getEarnings(Number(driverId)).pipe(catchError(() => of({ today: 0, thisWeek: 0, thisMonth: 0 }))),
    this.driverService.getStats(Number(driverId)).pipe(catchError(() => of(null)))
  ]).pipe(
    catchError((err) => {
      console.error('Erreur lors du chargement des données du chauffeur. Utilisation des données mock.', err);
      // Retourner un tuple de 4 éléments avec les valeurs par défaut
      return of([null, [], { today: 0, thisWeek: 0, thisMonth: 0 }, null] as const);
    })
  ).subscribe({
    next: ([profile, rides, earnings, stats]) => {
      this.driverProfile = profile;
      this.recentRides = rides.slice(0, 3);
      this.earnings = earnings;
      this.stats = stats;
      this.isOnline = profile ? profile.est_en_ligne : false;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erreur inattendue dans le chargement des données.', err);
      this.isLoading = false;
    }
  });
}
  // --- Mise en place des mises à jour en temps réel ---
  setupRealtimeUpdates() {
    this.notificationSubscription = this.notificationService.getNotifications().pipe(
      catchError((err) => {
        console.error('Erreur lors de la récupération des notifications. Utilisation de notifications mock.', err);
        // Retourner des notifications mock en cas d'erreur
        return of([
          {
            id: 'notif_mock_1',
            type: 'system_alert',
            title: 'Mode Hors Ligne',
            message: 'Vous utilisez actuellement des données de démonstration.',
            isRead: false,
            isUrgent: false,
            created_at: new Date().toISOString(),
            recipient: 1
          }
        ]);
      })
    ).subscribe({
      next: (notifications) => {
        this.unreadNotifications = notifications.filter(n => !n.isRead);
        this.unreadCount = this.unreadNotifications.length;
        if (this.unreadNotifications.some(n => n.isUrgent)) {
          this.playUrgentNotificationSound();
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des notifications:', err);
      }
    });
  }

  // --- Actions de l'interface ---
  toggleNotificationPanel() {
    this.isNotificationExpanded = !this.isNotificationExpanded;
  }

  markAllAsRead() {
    this.unreadNotifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    this.notificationService.markAllAsRead();
  }

  // --- Navigation ---
  goToProfile() {
    this.router.navigate(['/driver/profile']);
  }

  goToRides() {
    this.router.navigate(['/driver/rides']);
  }

  goToEarnings() {
    this.router.navigate(['/driver/earnings']);
  }

  goToSettings() {
    this.router.navigate(['/driver/notifications-settings']);
  }

  // --- Actions sur le statut en ligne ---
  goOnline() {
    const driverId = this.authService.getUserId();
    if (!driverId) return;
    this.isOnline = true;
    this.driverService.updateOnlineStatus(Number(driverId), true).subscribe({
      error: (err) => {
        this.isOnline = false;
        this.notificationService.showErrorToast('Impossible de passer en ligne.');
      }
    });
  }

  goOffline() {
    const driverId = this.authService.getUserId();
    if (!driverId) return;
    this.isOnline = false;
    this.driverService.updateOnlineStatus(Number(driverId), false).subscribe({
      error: (err) => {
        this.isOnline = true; // Revenir en arrière en cas d'erreur
        this.notificationService.showErrorToast('Impossible de passer hors ligne.');
      }
    });
  }

  // --- Utilitaires d'affichage ---
  getRideStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  getRideStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      case 'pending': return 'En attente';
      default: return status;
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'new_ride': return 'icon-success';
      case 'ride_cancelled': return 'icon-error';
      case 'payment_received': return 'icon-info';
      case 'system_alert': return 'icon-warning';
      default: return '';
    }
  }

  getNotificationIconName(type: string): string {
    switch (type) {
      case 'new_ride': return 'car-outline';
      case 'ride_cancelled': return 'close-circle-outline';
      case 'payment_received': return 'card-outline';
      case 'system_alert': return 'warning-outline';
      default: return 'notifications-outline';
    }
  }

  // --- Méthodes pour les revenus ---
  getEarningsProgress(type: 'day' | 'week' | 'month'): number {
    switch (type) {
      case 'day':
        return this.earnings.today;
      case 'week':
        return this.earnings.thisWeek;
      case 'month':
        return this.earnings.thisMonth;
      default:
        return 0;
    }
  }

  getEarningsProgressMax(type: 'day' | 'week' | 'month'): number {
    switch (type) {
      case 'day':
        return 15000;
      case 'week':
        return 100000;
      case 'month':
        return 400000;
      default:
        return 0;
    }
  }
  
  // --- Méthodes manquantes ---
  goToRideDetail(rideId: number) {
    this.router.navigate(['/driver/ride-detail', { rideId: rideId }]);
  }

  markAsRead(notificationId: number) {
    this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notificationId);
    this.unreadCount = this.unreadNotifications.length;
    this.notificationService.markAsRead(notificationId);
  }

  goToAllNotifications() {
    this.router.navigate(['/driver/notifications']);
  }

  // --- Gestion des sons (simulation) ---
  playUrgentNotificationSound() {
    console.log('🔔 Jouer le son de notification urgente !');
    // Dans une vraie app, vous utiliseriez le plugin Native Audio
    // this.audio.play('assets/sounds/urgent.mp3');
  }
}
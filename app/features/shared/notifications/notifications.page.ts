// notifications.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // IMPORTANT pour ngModel
import { Subscription, interval } from 'rxjs';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
  IonAvatar,
  IonNote,
  IonList,
  IonListHeader,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonModal,
  IonFab,
  IonFabButton,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  carOutline,
  cashOutline,
  starOutline,
  chatbubbleOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  trashOutline,
  checkmarkDoneOutline,
  settingsOutline,
  arrowForwardOutline,
  personOutline,
  callOutline,
  ellipsisHorizontalOutline
} from 'ionicons/icons';

// Interface pour les notifications
export interface AppNotification {
  id: number;
  type: 'new_ride' | 'ride_accepted' | 'ride_started' | 'ride_completed' | 'ride_cancelled' | 
        'payment_received' | 'rating_received' | 'message' | 'promotion' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  isUrgent: boolean;
  createdAt: string;
  rideId?: number;
  driverId?: number;
  clientId?: number;
  amount?: number;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // AJOUT OBLIGATOIRE pour ngModel
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonButton,
    IonAvatar,
    IonNote,
    IonList,
    IonListHeader,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonModal,
    IonFab,
    IonFabButton
  ]
})
export class NotificationsPage implements OnInit, OnDestroy {
  
  // Données
  allNotifications: AppNotification[] = [];
  filteredNotifications: AppNotification[] = [];
  selectedSegment: 'all' | 'unread' | 'rides' | 'payments' | 'promos' = 'all';
  
  // États
  isLoading = true;
  isRefreshing = false;
  showFilterModal = false;
  selectedNotification: AppNotification | null = null;
  showDetailModal = false;
  
  // Statistiques
  stats = {
    total: 0,
    unread: 0,
    urgent: 0
  };

  // Abonnements
  private notificationSubscription: Subscription = new Subscription();

  // Rendre router public pour l'utiliser dans le template
  constructor(
    public router: Router, // CHANGÉ de private à public
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      notificationsOutline,
      carOutline,
      cashOutline,
      starOutline,
      chatbubbleOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      trashOutline,
      checkmarkDoneOutline,
      settingsOutline,
      arrowForwardOutline,
      personOutline,
      callOutline,
      ellipsisHorizontalOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
    this.startRealTimeUpdates();
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // ================================
  // CHARGEMENT DES DONNÉES
  // ================================

  loadNotifications(event?: any) {
    this.isLoading = true;

    // Simuler un chargement depuis une API
    setTimeout(() => {
      this.allNotifications = this.generateMockNotifications();
      this.calculateStats();
      this.applyFilter();
      this.isLoading = false;
      this.isRefreshing = false;
      
      if (event) {
        event.target.complete();
      }
    }, 1000);
  }

  private generateMockNotifications(): AppNotification[] {
    return [
      {
        id: 1,
        type: 'new_ride',
        title: 'Nouvelle course disponible',
        message: 'Course de Mvog-Mbi à Akwa, Douala - 4500 FCFA',
        isRead: false,
        isUrgent: true,
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min
        rideId: 101,
        amount: 4500
      },
      {
        id: 2,
        type: 'ride_accepted',
        title: 'Course acceptée',
        message: 'Votre course a été acceptée par Mohamed K.',
        isRead: false,
        isUrgent: false,
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 min
        rideId: 102,
        driverId: 201
      },
      {
        id: 3,
        type: 'payment_received',
        title: 'Paiement reçu',
        message: 'Vous avez reçu 2500 FCFA pour la course #103',
        isRead: true,
        isUrgent: false,
        createdAt: new Date(Date.now() - 60 * 60000).toISOString(), // 1h
        rideId: 103,
        amount: 2500
      },
      {
        id: 4,
        type: 'rating_received',
        title: 'Nouvelle évaluation',
        message: 'Un client vous a noté 5 étoiles !',
        isRead: true,
        isUrgent: false,
        createdAt: new Date(Date.now() - 120 * 60000).toISOString(), // 2h
        rideId: 104
      },
      {
        id: 5,
        type: 'message',
        title: 'Message du support',
        message: 'Merci d\'utiliser MoovCity ! Découvrez nos offres spéciales.',
        isRead: false,
        isUrgent: false,
        createdAt: new Date(Date.now() - 180 * 60000).toISOString(), // 3h
      },
      {
        id: 6,
        type: 'ride_cancelled',
        title: 'Course annulée',
        message: 'La course #105 a été annulée par le client',
        isRead: true,
        isUrgent: false,
        createdAt: new Date(Date.now() - 240 * 60000).toISOString(), // 4h
        rideId: 105
      },
      {
        id: 7,
        type: 'promotion',
        title: 'Promotion spéciale',
        message: '10% de réduction sur vos 5 prochaines courses !',
        isRead: false,
        isUrgent: false,
        createdAt: new Date(Date.now() - 300 * 60000).toISOString(), // 5h
      },
      {
        id: 8,
        type: 'ride_started',
        title: 'Course en cours',
        message: 'Votre course avec Jean D. a commencé',
        isRead: true,
        isUrgent: false,
        createdAt: new Date(Date.now() - 360 * 60000).toISOString(), // 6h
        rideId: 106,
        clientId: 301
      },
      {
        id: 9,
        type: 'ride_completed',
        title: 'Course terminée',
        message: 'Course #107 terminée avec succès',
        isRead: true,
        isUrgent: false,
        createdAt: new Date(Date.now() - 420 * 60000).toISOString(), // 7h
        rideId: 107
      },
      {
        id: 10,
        type: 'system_alert',
        title: 'Mise à jour disponible',
        message: 'Une nouvelle version de l\'application est disponible',
        isRead: true,
        isUrgent: false,
        createdAt: new Date(Date.now() - 1440 * 60000).toISOString(), // 1 jour
      }
    ];
  }

  startRealTimeUpdates() {
    // Simuler des mises à jour en temps réel toutes les 30 secondes
    this.notificationSubscription = interval(30000).subscribe(() => {
      // Simuler une nouvelle notification
      const newNotification: AppNotification = {
        id: Date.now(),
        type: 'new_ride',
        title: '🚗 Nouvelle course en temps réel',
        message: 'Course disponible près de chez vous',
        isRead: false,
        isUrgent: true,
        createdAt: new Date().toISOString(),
        rideId: 108,
        amount: 3800
      };
      
      this.allNotifications.unshift(newNotification);
      this.calculateStats();
      this.applyFilter();
      this.showToast('Nouvelle notification reçue', 'primary');
    });
  }

  // ================================
  // FILTRAGE
  // ================================

  applyFilter() {
    switch (this.selectedSegment) {
      case 'unread':
        this.filteredNotifications = this.allNotifications.filter(n => !n.isRead);
        break;
      case 'rides':
        this.filteredNotifications = this.allNotifications.filter(
          n => ['new_ride', 'ride_accepted', 'ride_started', 'ride_completed', 'ride_cancelled'].includes(n.type)
        );
        break;
      case 'payments':
        this.filteredNotifications = this.allNotifications.filter(
          n => ['payment_received', 'rating_received'].includes(n.type)
        );
        break;
      case 'promos':
        this.filteredNotifications = this.allNotifications.filter(
          n => ['promotion', 'system_alert'].includes(n.type)
        );
        break;
      default:
        this.filteredNotifications = [...this.allNotifications];
    }
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.applyFilter();
  }

  // ================================
  // STATISTIQUES
  // ================================

  calculateStats() {
    const urgentCount = this.allNotifications.filter(n => n.isUrgent && !n.isRead).length;
    this.stats = {
      total: this.allNotifications.length,
      unread: this.allNotifications.filter(n => !n.isRead).length,
      urgent: urgentCount
    };
  }

  // ================================
  // ACTIONS SUR LES NOTIFICATIONS
  // ================================

  markAsRead(notification: AppNotification) {
    if (!notification.isRead) {
      notification.isRead = true;
      this.calculateStats();
      this.applyFilter();
    }
  }

  markAllAsRead() {
    this.allNotifications.forEach(n => n.isRead = true);
    this.calculateStats();
    this.applyFilter();
    this.showToast('Toutes les notifications ont été marquées comme lues', 'success');
  }

  deleteNotification(notification: AppNotification, event: Event) {
    event.stopPropagation();
    
    this.alertCtrl.create({
      header: 'Supprimer',
      message: 'Voulez-vous supprimer cette notification ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          handler: () => {
            this.allNotifications = this.allNotifications.filter(n => n.id !== notification.id);
            this.calculateStats();
            this.applyFilter();
            this.showToast('Notification supprimée', 'warning');
          }
        }
      ]
    }).then(alert => alert.present());
  }

  async clearAll() {
    if (this.filteredNotifications.length === 0) {
      this.showToast('Aucune notification à supprimer', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Tout supprimer',
      message: `Voulez-vous supprimer toutes les ${this.filteredNotifications.length} notifications ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          handler: () => {
            if (this.selectedSegment === 'all') {
              this.allNotifications = [];
            } else {
              // Supprimer seulement les notifications du filtre actuel
              const typesToRemove = this.filteredNotifications.map(n => n.type);
              this.allNotifications = this.allNotifications.filter(n => !typesToRemove.includes(n.type));
            }
            this.calculateStats();
            this.applyFilter();
            this.showToast('Notifications supprimées', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  // ================================
  // ACTIONS SUR LES NOTIFICATIONS
  // ================================

  onNotificationClick(notification: AppNotification) {
    this.markAsRead(notification);
    this.selectedNotification = notification;
    this.showDetailModal = true;
  }

  // ================================
  // MODALES
  // ================================

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedNotification = null;
  }

  // ================================
  // UTILITAIRES D'AFFICHAGE
  // ================================

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      new_ride: 'car-outline',
      ride_accepted: 'checkmark-circle-outline',
      ride_started: 'time-outline',
      ride_completed: 'flag-outline',
      ride_cancelled: 'close-circle-outline',
      payment_received: 'cash-outline',
      rating_received: 'star-outline',
      message: 'chatbubble-outline',
      promotion: 'notifications-outline',
      system_alert: 'alert-circle-outline'
    };
    return icons[type] || 'notifications-outline';
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      new_ride: 'primary',
      ride_accepted: 'success',
      ride_started: 'tertiary',
      ride_completed: 'medium',
      ride_cancelled: 'danger',
      payment_received: 'success',
      rating_received: 'warning',
      message: 'primary',
      promotion: 'secondary',
      system_alert: 'warning'
    };
    return colors[type] || 'primary';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  }

  getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
      new_ride: 'Nouvelle course',
      ride_accepted: 'Course acceptée',
      ride_started: 'Course en cours',
      ride_completed: 'Course terminée',
      ride_cancelled: 'Course annulée',
      payment_received: 'Paiement reçu',
      rating_received: 'Nouvelle évaluation',
      message: 'Message',
      promotion: 'Promotion',
      system_alert: 'Alerte système'
    };
    return titles[type] || 'Notification';
  }

  // ================================
  // REFRESH
  // ================================

  doRefresh(event: any) {
    this.isRefreshing = true;
    this.loadNotifications(event);
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

  goToSettings() {
    this.router.navigate(['/driver/notifications-settings']);
  }

  goBack() {
    const userRole = localStorage.getItem('user_role') || 'driver';
    this.router.navigate([`/${userRole}/home`]);
  }

  navigateToRideDetail(rideId: number) {
    this.router.navigate(['/driver/ride-detail', rideId]);
    this.closeDetailModal();
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Auth } from './auth/auth';// adapte le chemin si besoin
import { ToastController, LoadingController } from '@ionic/angular';

// Interface pour une notification
export interface Notification {
  id?: number;
  type: 'new_ride' | 'ride_cancelled' | 'payment_received' | 'system_alert';
  title: string;
  message: string;
  isRead: boolean;
  isUrgent: boolean;
  created_at?: string;
  recipient: number;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly API_URL = 'https://votre-api-django.com/api/notifications';

  constructor(
    private http: HttpClient,
    private auth: Auth,
     private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  // ===============================
  // UTILITAIRE
  // ===============================

  private getCurrentUserId(): number {
    const userId = this.auth.getUserId();
    // if (!userId) {
    //   throw new Error('Utilisateur non authentifié');
    // }
    return Number(userId);
  }

  // ===============================
  // RÉCUPÉRATION
  // ===============================

  getNotifications(): Observable<Notification[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<Notification[]>(`${this.API_URL}/user/${userId}/`)
      .pipe(catchError(this.handleError));
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${this.API_URL}/${notificationId}/mark-read/`, {})
      .pipe(catchError(this.handleError));
  }

  markAllAsRead(): Observable<any> {
    const userId = this.getCurrentUserId();
    return this.http.post(`${this.API_URL}/user/${userId}/mark-all-read/`, {})
      .pipe(catchError(this.handleError));
  }

  removeNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${notificationId}/`)
      .pipe(catchError(this.handleError));
  }

  // ===============================
  // NOTIFICATIONS AUTOMATIQUES
  // ===============================

  notifyNewRide(rideId: number, passengerName: string): Observable<Notification> {
    const body = {
      type: 'new_ride',
      title: 'Nouvelle course !',
      message: `Nouvelle course de ${passengerName}.`,
      isUrgent: true,
      recipient: this.getCurrentUserId(),
      data: { rideId }
    };

    return this.http.post<Notification>(`${this.API_URL}/`, body)
      .pipe(catchError(this.handleError));
  }

  notifyRideCancelled(rideId: number, passengerName: string): Observable<Notification> {
    const body = {
      type: 'ride_cancelled',
      title: 'Course annulée',
      message: `La course avec ${passengerName} a été annulée.`,
      isUrgent: false,
      recipient: this.getCurrentUserId(),
      data: { rideId }
    };

    return this.http.post<Notification>(`${this.API_URL}/`, body)
      .pipe(catchError(this.handleError));
  }

  notifyPaymentReceived(amount: number): Observable<Notification> {
    const body = {
      type: 'payment_received',
      title: 'Paiement reçu !',
      message: `Vous avez reçu ${amount} FCFA pour votre dernière course.`,
      isUrgent: false,
      recipient: this.getCurrentUserId()
    };

    return this.http.post<Notification>(`${this.API_URL}/`, body)
      .pipe(catchError(this.handleError));
  }
/**
   * Affiche un loader (indicateur de chargement).
   * @param message Le message à afficher sous le loader.
   * @returns L'instance du loading pour pouvoir le fermer manuellement.
   */
  async showLoading(message: string = 'Chargement...'): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'bubbles',
      cssClass: 'custom-loading'
    });
    await loading.present();
    return loading;
  }
  notifySystemAlert(message: string): Observable<Notification> {
    const body = {
      type: 'system_alert',
      title: 'Alerte Système',
      message: message,
      isUrgent: true,
      recipient: this.getCurrentUserId()
    };

    return this.http.post<Notification>(`${this.API_URL}/`, body)
      .pipe(catchError(this.handleError));
  }
  showSuccessToast(message: string): Observable<Notification> {
    const body = {
      type: 'system_alert',
      title: 'Alerte Système',
      message: message,
      isUrgent: true,
      recipient: this.getCurrentUserId()
    };

    return this.http.post<Notification>(`${this.API_URL}/`, body)
      .pipe(catchError(this.handleError));
  }
  showErrorToast(message: string): Observable<Notification> {
    const body = {
      type: 'system_alert',
      title: 'Alerte Système',
      message: message,
      isUrgent: true,
      recipient: this.getCurrentUserId()
    };

    return this.http.post<Notification>(`${this.API_URL}/`, body)
      .pipe(catchError(this.handleError));
  }

  // ===============================
  // GESTION DES ERREURS
  // ===============================

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.detail || 'Erreur de validation.';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Accès interdit.';
          break;
        case 404:
          errorMessage = 'La ressource demandée n\'existe pas.';
          break;
        default:
          if (error.status >= 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }
      }
    }

    console.error('NotificationService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

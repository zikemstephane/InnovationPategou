import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { NotificationService } from './notification';
import {
  PaymentMethod,
  Transaction,
  Wallet
} from 'src/app/application/models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class Paymentservice {

  private readonly API_URL = 'https://votre-api-django.com/api/payments';

  private walletSubject = new BehaviorSubject<Wallet | null>(null);
  public wallet$ = this.walletSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // ===============================
  // WALLET
  // ===============================

  getWallet(userId: string | null): Observable<Wallet> {
    return this.http
      .get<Wallet>(`${this.API_URL}/wallet/user/${userId}/`)
      .pipe(
        tap(wallet => this.walletSubject.next(wallet)),
        catchError(this.handleError.bind(this))
      );
  }

  // ===============================
  // PAYMENT METHODS
  // ===============================

  addPaymentMethod(
    userId: string | null,
    methodData: Partial<PaymentMethod>
  ): Observable<PaymentMethod> {
    return this.http
      .post<PaymentMethod>(
        `${this.API_URL}/methods/user/${userId}/`,
        methodData
      )
      .pipe(
        tap(newMethod => {
          const currentWallet = this.walletSubject.value;
          if (currentWallet) {
            currentWallet.methodsPaiement.push(newMethod);
            this.walletSubject.next({ ...currentWallet });
          }
          this.notificationService.showSuccessToast(
            'Méthode de paiement ajoutée !'
          );
        }),
        catchError(this.handleError.bind(this))
      );
  }

  setDefaultPaymentMethod(
    userId: string | null,
    methodId: string
  ): Observable<any> {
    return this.http
      .patch(
        `${this.API_URL}/methods/user/${userId}/${methodId}/set-default/`,
        {}
      )
      .pipe(
        tap(() => {
          const currentWallet = this.walletSubject.value;
          if (currentWallet) {
            currentWallet.methodsPaiement.forEach(method => {
              method.isDefault = method.id === methodId;
            });
            this.walletSubject.next({ ...currentWallet });
          }
          this.notificationService.showSuccessToast(
            'Méthode par défaut mise à jour.'
          );
        }),
        catchError(this.handleError.bind(this))
      );
  }

  deletePaymentMethod(
    userId: string | null,
    methodId: string
  ): Observable<any> {
    return this.http
      .delete(
        `${this.API_URL}/methods/user/${userId}/${methodId}/`
      )
      .pipe(
        tap(() => {
          const currentWallet = this.walletSubject.value;
          if (currentWallet) {
            currentWallet.methodsPaiement =
              currentWallet.methodsPaiement.filter(
                method => method.id !== methodId
              );
            this.walletSubject.next({ ...currentWallet });
          }
          this.notificationService.showSuccessToast(
            'Méthode de paiement supprimée.'
          );
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // ===============================
  // PAYMENTS
  // ===============================

  processRidePayment(
    userId: string,
    rideId: number,
    paymentMethodId: string
  ): Observable<Transaction> {

    const body = {
      user_id: userId,
      ride_id: rideId,
      payment_method_id: paymentMethodId
    };

    return this.http
      .post<Transaction>(
        `${this.API_URL}/process-payment/`,
        body
      )
      .pipe(
        tap(transaction => {
          const currentWallet = this.walletSubject.value;
          if (currentWallet) {
            currentWallet.transactions.unshift(transaction);
            this.walletSubject.next({ ...currentWallet });
          }
          this.notificationService.showSuccessToast(
            'Paiement effectué avec succès !'
          );
        }),
        catchError(this.handleError.bind(this))
      );
  }

  topUpWallet(
    userId: string,
    amount: number,
    paymentMethodId: string
  ): Observable<Transaction> {

    const body = {
      user_id: userId,
      montant: amount,
      payment_method_id: paymentMethodId,
      description: 'Recharge du portefeuille MoovCity'
    };

    return this.http
      .post<Transaction>(
        `${this.API_URL}/top-up/`,
        body
      )
      .pipe(
        tap(transaction => {
          const currentWallet = this.walletSubject.value;
          if (currentWallet) {
            currentWallet.solde += amount;
            currentWallet.transactions.unshift(transaction);
            this.walletSubject.next({ ...currentWallet });
          }
          this.notificationService.showSuccessToast(
            `Recharge de ${amount} XOF réussie !`
          );
        }),
        catchError(this.handleError.bind(this))
      );
  }

  getTransactionHistory(userId: string): Observable<Transaction[]> {
    return this.http
      .get<Transaction[]>(
        `${this.API_URL}/transactions/user/${userId}/`
      )
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // ===============================
  // ERROR HANDLER
  // ===============================

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur de paiement est survenue.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage =
            error.error?.detail || 'Données de paiement invalides.';
          break;
        case 401:
          errorMessage =
            'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 402:
          errorMessage =
            'Paiement refusé. Vérifiez vos informations.';
          break;
        case 403:
          errorMessage = 'Accès interdit.';
          break;
        case 404:
          errorMessage =
            'Ressource de paiement introuvable.';
          break;
        case 500:
          errorMessage =
            'Erreur serveur lors du traitement du paiement.';
          break;
      }
    }

    console.error('PaymentService Error:', error);
    this.notificationService.showErrorToast(errorMessage);

    return throwError(() => new Error(errorMessage));
  }
}

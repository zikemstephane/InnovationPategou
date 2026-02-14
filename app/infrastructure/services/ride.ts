import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Ride } from 'src/app/application/models/ride';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RideService {

  private readonly API_URL = 'https://votre-api-django.com/api/rides';

  constructor(private http: HttpClient) {}

  // ===============================
  // GETTERS
  // ===============================

  getRideById(rideId: number): Observable<Ride> {
    return this.http.get<Ride>(`${environment.apiUrl}/${rideId}/`)
      .pipe(catchError(this.handleError));
  }

  getRides(userId?: number): Observable<Ride[]> {
    const url = userId
      ? `${environment.apiUrl}/user/${userId}/rides/`
      : `${this.API_URL}/`;

    return this.http.get<Ride[]>(url)
      .pipe(catchError(this.handleError));
  }

  get_by_chauffeur(driverId: number): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${environment.apiUrl}/courses`)
      .pipe(catchError(this.handleError));
  }

  getActiveRides(): Observable<Ride[]> {
    return this.http.get<Ride[]>(`${environment.apiUrl}/active/`)
      .pipe(catchError(this.handleError));
  }

  // ===============================
  // CREATE
  // ===============================

  createRide(rideData: any): Observable<Ride> {
    return this.http.post<Ride>(`${environment.apiUrl}/`, rideData).pipe(
      tap((ride) => console.log('Nouvelle course créée:', ride)),
      catchError(this.handleError)
    );
  }

  /**
   * Recherche des lieux en fonction d'une chaîne de caractères.
   * @param query La chaîne de caractères à rechercher.
   */
  searchLocations(query: string): Observable<any[]> {
    return this.http.post<any[]>(`${environment.apiUrl}/search-locations/`, { query }).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================
  // ACTIONS CHAUFFEUR
  // ===============================

  acceptRide(rideId: number, driverId: number): Observable<Ride> {
    return this.http.post<Ride>(
      `${environment.apiUrl}/${rideId}/accept/`,
      { driver_id: driverId }
    ).pipe(
      tap(() => console.log(`Course ${rideId} acceptée.`)),
      catchError(this.handleError)
    );
  }

  declineRide(rideId: number, driverId: number): Observable<Ride> {
    return this.http.post<Ride>(
      `${environment.apiUrl}/${rideId}/decline/`,
      { driver_id: driverId }
    ).pipe(
      tap(() => console.log(`Course ${rideId} refusée.`)),
      catchError(this.handleError)
    );
  }

  startRide(rideId: number): Observable<Ride> {
    return this.http.post<Ride>(
      `${environment.apiUrl}/${rideId}/start/`,
      {}
    ).pipe(
      tap(() => console.log(`Course ${rideId} démarrée.`)),
      catchError(this.handleError)
    );
  }

  endRide(
    rideId: number,
    endData: { prix_final?: number; duree_reelle?: string }
  ): Observable<Ride> {
    return this.http.post<Ride>(
      `${environment.apiUrl}/${rideId}/end/`,
      endData
    ).pipe(
      tap(() => console.log(`Course ${rideId} terminée.`)),
      catchError(this.handleError)
    );
  }

  cancelRide(rideId: number, reason: string): Observable<Ride> {
    return this.http.post<Ride>(
      `${environment.apiUrl}/${rideId}/cancel/`,
      { reason }
    ).pipe(
      tap(() => console.log(`Course ${rideId} annulée.`)),
      catchError(this.handleError)
    );
  }

  // ===============================
  // ACTIONS CLIENT
  // ===============================

  rateRide(rideId: number, rating: number, comment?: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/${rideId}/rate/`,
      { rating, comment }
    ).pipe(
      tap(() => console.log(`Course ${rideId} notée.`)),
      catchError(this.handleError)
    );
  }

  requestRideCancellation(rideId: number, reason: string): Observable<Ride> {
    return this.http.post<Ride>(
      `${environment.apiUrl}/${rideId}/request-cancellation/`,
      { reason }
    ).pipe(
      tap(() => console.log(`Annulation demandée pour la course ${rideId}.`)),
      catchError(this.handleError)
    );
  }

  // ===============================
  // SUIVI EN TEMPS RÉEL
  // ===============================

  trackRide(rideId: number): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/${rideId}/track/`
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateDriverLocation(rideId: number, latitude: number, longitude: number): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/${rideId}/update-location/`,
      { latitude, longitude }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================
  // HISTORIQUE ET STATISTIQUES
  // ===============================

  getRideHistory(
    userId: number, 
    role: 'client' | 'chauffeur',
    params?: { start_date?: string; end_date?: string; status?: string }
  ): Observable<Ride[]> {
    return this.http.get<Ride[]>(
      `${environment.apiUrl}/history/${role}/${userId}/`,
      { params: { ...params } }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getRideStats(userId: number, role: 'client' | 'chauffeur'): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/stats/${role}/${userId}/`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================
  // SÉCURITÉ
  // ===============================

  validateSafeRideCode(rideId: number, code: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(
      `${environment.apiUrl}/${rideId}/validate-code/`,
      { code }
    ).pipe(
      catchError(this.handleError)
    );
  }

  generateSafeRideCode(rideId: number): Observable<{ code: string }> {
    return this.http.post<{ code: string }>(
      `${environment.apiUrl}/${rideId}/generate-code/`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================
  // FACTURATION
  // ===============================

  getRideInvoice(rideId: number): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/${rideId}/invoice/`,
      { responseType: 'blob' as 'json' }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ===============================
  // ERROR HANDLER
  // ===============================

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
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
          errorMessage = 'Ressource introuvable.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = error.error?.detail || `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('RideService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
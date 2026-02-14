// src/app/infrastructure/services/driver.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { DriverProfile } from 'src/app/application/models/driver-profile.model';
import { environment } from 'src/environments/environment';
export interface Earnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface DriverStats {
  totalRides: number;
  averageRating: number;
  completionRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {

  private readonly API_URL = 'https://votre-api-django.com/api/drivers';

  constructor(private http: HttpClient) {}

  /**
   * Récupère le profil complet du chauffeur.
   */
  getProfile(driverId: number): Observable<DriverProfile> {
    return this.http.get<DriverProfile>(`${environment.apiUrl}/${driverId}/`).pipe(
      map((data: any) => this.mapToDriverProfile(data)),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour le profil du chauffeur.
   */
  updateProfile(driverId: number, profileData: Partial<DriverProfile>): Observable<DriverProfile> {
    return this.http.put<DriverProfile>(`${environment.apiUrl}/vehicules/${driverId}/`, profileData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour le statut en ligne du chauffeur.
   */
  updateOnlineStatus(driverId: number, isOnline: boolean): Observable<any> {
    const body = { est_en_ligne: isOnline };
    return this.http.patch(`${environment.apiUrl}/${driverId}/status/`, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour la localisation du chauffeur.
   */
  updateLocation(driverId: number, location: { latitude: number; longitude: number }): Observable<any> {
    const body = { localisation_actuelle: location };
    return this.http.patch(`${environment.apiUrl}/${driverId}/location/`, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les revenus du chauffeur pour différentes périodes.
   */
  getEarnings(driverId: number): Observable<Earnings> {
    return this.http.get<Earnings>(`${environment.apiUrl}/${driverId}/earnings/`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques du chauffeur.
   */
  getStats(driverId: number): Observable<DriverStats> {
    return this.http.get<DriverStats>(`${environment.apiUrl}/${driverId}/stats/`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Mapper la réponse JSON de l'API vers l'interface TypeScript.
   */
  private mapToDriverProfile(data: any): DriverProfile {
    return {
      id: data.id,
      user: {
        id: data.user.id,
        name: `${data.user.first_name} ${data.user.last_name}`,
        email: data.user.email,
        photo: data.user.photo,
        phone_number: data.user.phone_number,
      },
      photo: data.photo,
      date_de_naissance: data.date_de_naissance,
      numero_permis: data.numero_permis,
      numero_piece_identite: data.numero_piece_identite,
      vehicule_actuel: data.vehicule_actuel,
      est_en_ligne: data.est_en_ligne,
      localisation_actuelle: data.localisation_actuelle,
      derniere_localisation: data.derniere_localisation,
      total_earnings: data.total_earnings,
      monthly_earnings: data.monthly_earnings,
      average_rating: data.average_rating,
      completion_rate: data.completion_rate,
      date_creation: data.date_creation
    };
  }

  /**
   * Gestion centralisée des erreurs HTTP.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue.';
    if (error.status === 401) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      // Potentiellement déconnecter l'utilisateur ici
    }
    console.error('DriverService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
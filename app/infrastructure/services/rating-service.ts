// rating.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// Interface pour la soumission d'une note
export interface RatingSubmission {
  ride_id: number;
  driver_id: number;
  client_id: number;
  rating: number; // 1 à 5
  comment?: string;
  criteria?: {
    punctuality?: number;
    driving?: number;
    cleanliness?: number;
    professionalism?: number;
  };
}

// Interface pour une note reçue
export interface Rating {
  id: number;
  ride_id: number;
  driver_id: number;
  client_id: number;
  client_name: string;
  client_photo?: string;
  rating: number;
  comment?: string;
  criteria?: {
    punctuality: number;
    driving: number;
    cleanliness: number;
    professionalism: number;
  };
  created_at: string;
}

// Interface pour les statistiques de notation
export interface DriverRatingStats {
  driver_id: number;
  average_rating: number;
  total_ratings: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  criteria_averages?: {
    punctuality: number;
    driving: number;
    cleanliness: number;
    professionalism: number;
  };
  recent_ratings: Rating[];
}

@Injectable({
  providedIn: 'root'
})
export class RatingService {

  private readonly API_URL = environment.apiUrl + '/ratings';

  // Mock data pour le développement
  private mockRatings: Record<number, Rating[]> = {
    201: [
      {
        id: 1,
        ride_id: 101,
        driver_id: 201,
        client_id: 301,
        client_name: 'Jean Dupont',
        client_photo: 'assets/icon/default-avatar.svg',
        rating: 5,
        comment: 'Excellent chauffeur, très professionnel',
        criteria: {
          punctuality: 5,
          driving: 5,
          cleanliness: 5,
          professionalism: 5
        },
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        ride_id: 102,
        driver_id: 201,
        client_id: 302,
        client_name: 'Marie Koné',
        client_photo: 'assets/icon/default-avatar.svg',
        rating: 4,
        comment: 'Très bien, mais un peu de retard',
        criteria: {
          punctuality: 3,
          driving: 4,
          cleanliness: 5,
          professionalism: 4
        },
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    202: [
      {
        id: 3,
        ride_id: 103,
        driver_id: 202,
        client_id: 303,
        client_name: 'Sophie Yao',
        client_photo: 'assets/icon/default-avatar.svg',
        rating: 5,
        comment: 'Super course, très sympathique',
        created_at: new Date().toISOString()
      }
    ]
  };

  constructor(private http: HttpClient) {}

  // ===============================
  // SOUMISSION DE NOTE
  // ===============================

  /**
   * Soumet une note pour un chauffeur après une course
   */
  submitRating(ratingData: RatingSubmission): Observable<any> {
    // Version avec API réelle
    // return this.http.post(`${this.API_URL}/`, ratingData).pipe(
    //   tap(response => console.log('Note soumise avec succès', response)),
    //   catchError(this.handleError)
    // );

    // Version mock pour le développement
    return new Observable((observer) => {
      setTimeout(() => {
        console.log('Note soumise (mock):', ratingData);
        observer.next({ 
          success: true, 
          message: 'Note soumise avec succès',
          id: Math.floor(Math.random() * 1000)
        });
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Soumet une note détaillée avec critères multiples
   */
  submitDetailedRating(
    rideId: number, 
    driverId: number, 
    clientId: number,
    rating: number, 
    criteria: { punctuality: number; driving: number; cleanliness: number; professionalism: number },
    comment?: string
  ): Observable<any> {
    const ratingData: RatingSubmission = {
      ride_id: rideId,
      driver_id: driverId,
      client_id: clientId,
      rating,
      criteria,
      comment
    };
    return this.submitRating(ratingData);
  }

  // ===============================
  // RÉCUPÉRATION DES NOTES
  // ===============================

  /**
   * Obtient toutes les notes pour un chauffeur spécifique
   */
  getRatingsForDriver(driverId: number): Observable<Rating[]> {
    // Version API réelle
    // return this.http.get<Rating[]>(`${this.API_URL}/driver/${driverId}/`).pipe(
    //   catchError(this.handleError)
    // );

    // Version mock
    return new Observable((observer) => {
      setTimeout(() => {
        const ratings = this.mockRatings[driverId] || [];
        observer.next(ratings);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Obtient les statistiques de notation pour un chauffeur
   */
  getDriverRatingStats(driverId: number): Observable<DriverRatingStats> {
    // Version API réelle
    // return this.http.get<DriverRatingStats>(`${this.API_URL}/driver/${driverId}/stats/`).pipe(
    //   catchError(this.handleError)
    // );

    // Version mock
    return new Observable((observer) => {
      setTimeout(() => {
        const ratings = this.mockRatings[driverId] || [];
        
        if (ratings.length === 0) {
          observer.next({
            driver_id: driverId,
            average_rating: 0,
            total_ratings: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            recent_ratings: []
          });
          return;
        }

        // Calculer la distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        
        ratings.forEach(r => {
          distribution[r.rating as keyof typeof distribution]++;
          sum += r.rating;
        });

        // Calculer les moyennes des critères
        let punctualitySum = 0, drivingSum = 0, cleanlinessSum = 0, professionalismSum = 0;
        let criteriaCount = 0;

        ratings.forEach(r => {
          if (r.criteria) {
            punctualitySum += r.criteria.punctuality || 0;
            drivingSum += r.criteria.driving || 0;
            cleanlinessSum += r.criteria.cleanliness || 0;
            professionalismSum += r.criteria.professionalism || 0;
            criteriaCount++;
          }
        });

        const stats: DriverRatingStats = {
          driver_id: driverId,
          average_rating: parseFloat((sum / ratings.length).toFixed(1)),
          total_ratings: ratings.length,
          distribution,
          recent_ratings: ratings.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).slice(0, 5)
        };

        if (criteriaCount > 0) {
          stats.criteria_averages = {
            punctuality: parseFloat((punctualitySum / criteriaCount).toFixed(1)),
            driving: parseFloat((drivingSum / criteriaCount).toFixed(1)),
            cleanliness: parseFloat((cleanlinessSum / criteriaCount).toFixed(1)),
            professionalism: parseFloat((professionalismSum / criteriaCount).toFixed(1))
          };
        }

        observer.next(stats);
        observer.complete();
      }, 500);
    });
  }

  /**
   * Vérifie si une course peut être notée
   */
  canRateRide(rideId: number, clientId: number): Observable<boolean> {
    // Version API réelle
    // return this.http.get<{ can_rate: boolean }>(`${this.API_URL}/can-rate/${rideId}/${clientId}/`).pipe(
    //   map(response => response.can_rate),
    //   catchError(() => of(false))
    // );

    // Version mock
    return new Observable((observer) => {
      setTimeout(() => {
        // Simuler qu'une course peut être notée si elle est terminée
        observer.next(true);
        observer.complete();
      }, 300);
    });
  }

  // ===============================
  // CALCULS ET UTILITAIRES
  // ===============================

  /**
   * Calcule la note moyenne à partir d'un tableau de notes
   */
  calculateAverageRating(ratings: Rating[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  }

  /**
   * Obtient le libellé d'une note
   */
  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = {
      1: 'Très mauvais',
      2: 'Mauvais',
      3: 'Moyen',
      4: 'Bon',
      5: 'Excellent'
    };
    return labels[rating] || 'Non noté';
  }

  /**
   * Obtient la couleur d'une note
   */
  getRatingColor(rating: number): string {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'primary';
    if (rating >= 2.5) return 'warning';
    return 'danger';
  }

  /**
   * Formate une date de notation
   */
  formatRatingDate(date: string): string {
    const ratingDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - ratingDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return ratingDate.toLocaleDateString('fr-FR');
  }

  // ===============================
  // GESTION DES ERREURS
  // ===============================

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erreur lors de la communication avec le serveur';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur';
          break;
      }
    }

    console.error('RatingService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
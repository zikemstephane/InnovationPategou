// auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// --- Interfaces pour la structure des données ---

/**
 * Interface représentant un utilisateur dans l'application
*/
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'chauffeur' | 'client';
  photo: string;
  nom?: string;      // Ajouté car vos données ont "nom"
  prenom?: string;   // Ajouté car vos données ont "prenom"
}

/**
 * Interface pour la réponse de la connexion
*/
export interface LoginResponse {
  requires2FA: true;
  tempToken: string;
  user: User;
  message?: string;
}

export interface lR {
  message: string;
  id?: number;        // Ajouté car vos données ont "id"
  email?: string;      // Ajouté car vos données ont "email"
  nom?: string;        // Ajouté car vos données ont "nom"
  prenom?: string;     // Ajouté car vos données ont "prenom"
  role?: string;       // Ajouté car vos données ont "role"
}

/**
 * Interface pour la réponse de la vérification 2FA
 */
export interface Verify2FAResponse {
  user: User;
  token: string;
}

export type UserRole = 'chauffeur' | 'client';

// --- Le Service d'Authentification ---

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('moovcity_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  public getToken(): string | null {
    return localStorage.getItem('moovcity_token');
  }

  /**
   * Connexion - retourne les données utilisateur
   */
  login(email: string, motdepasse: string): Observable<lR> {
    return this.http.post<lR>(`${environment.apiUrl}/auth/login/`, { email, motdepasse }).pipe(
      tap(response => {
        console.log('✅ Réponse login:', response);
        
        // Convertir la réponse en objet User
        if (response.id && response.email) {
          const user: User = {
            id: response.id.toString(),
            name: `${response.prenom || ''} ${response.nom || ''}`.trim() || response.email,
            email: response.email,
            phone: '',
            role: (response.role as 'chauffeur' | 'client') || 'client',
            photo: '',
            nom: response.nom,
            prenom: response.prenom
          };
          
          // Stocker les données temporaires
          localStorage.setItem('moovcity_temp_user', JSON.stringify(user));
          localStorage.setItem('moovcity_temp_email', response.email);
          
          // Si le backend retourne un tempToken, le stocker aussi
          // localStorage.setItem('moovcity_temp_token', response.tempToken);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Vérifie le code 2FA et finalise la connexion.
   */
  verify2FA(code: string, email: string): Observable<Verify2FAResponse> {
    return this.http.post<Verify2FAResponse>(`${environment.apiUrl}/auth/verify-otp/`, { code, email }).pipe(
      tap(response => {
        console.log('✅ Réponse vérification 2FA:', response);
        
        // Stocker les informations de session
        this.setSession(response.user, response.token);

        // Nettoyer les données temporaires
        localStorage.removeItem('moovcity_temp_token');
        localStorage.removeItem('moovcity_temp_user');
        localStorage.removeItem('moovcity_temp_email');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Renvoie le code 2FA.
   */
  resend2FACode(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/resend-2fa/`, { email }).pipe(
      tap(() => console.log('✅ Code renvoyé à:', email)),
      catchError(this.handleError)
    );
  }

  signup(
    nom: string,
    prenom: string,
    email: string,
    telephone: string,
    role: string,
    motdepasse: string,
    password_confirm: string,
    photo: File | null
  ): Observable<User> {
    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('prenom', prenom);
    formData.append('email', email);
    formData.append('telephone', telephone);
    formData.append('role', role);
    formData.append('motdepasse', motdepasse);
    formData.append('password_confirm', password_confirm);
    
    if (photo) {
      formData.append('photo', photo);
    }

    return this.http.post<User>(`${environment.apiUrl}/auth/register/`, formData).pipe(
      catchError(this.handleError)
    );
  }

  getUserRole(): UserRole | null {
    return this.currentUserValue?.role ?? null;
  }

  public getUserId(): string | null {
    return this.currentUserValue?.id ?? null;
  }

  logout(): void {
    localStorage.removeItem('moovcity_user');
    localStorage.removeItem('moovcity_token');
    localStorage.removeItem('moovcity_temp_token');
    localStorage.removeItem('moovcity_temp_user');
    localStorage.removeItem('moovcity_temp_email');

    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Non authentifié'));
    }

    return this.http.get<User>(`${environment.apiUrl}/auth/profile/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => {
        localStorage.setItem('moovcity_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleError)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Non authentifié'));
    }

    return this.http.post<void>(`${environment.apiUrl}/auth/change-password/`, {
      current_password: currentPassword,
      new_password: newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private setSession(user: User, token: string): void {
    localStorage.setItem('moovcity_user', JSON.stringify(user));
    localStorage.setItem('moovcity_token', token);
    this.currentUserSubject.next(user);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.status === 400) {
        if (typeof error.error === 'object' && error.error !== null) {
          const firstError = Object.keys(error.error)[0];
          errorMessage = Array.isArray(error.error[firstError])
            ? error.error[firstError][0]
            : error.error[firstError] || 'Erreur de validation';
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
      } else if (error.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.status === 403) {
        errorMessage = 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
      } else if (error.status === 404) {
        errorMessage = 'La ressource demandée n\'existe pas.';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }

    console.error('❌ AuthService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
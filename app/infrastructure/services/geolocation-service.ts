// geolocation.service.ts
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor(private platform: Platform) {}

  /**
   * Obtient la position actuelle de l'utilisateur via l'API Geolocation du navigateur.
   */
  getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      if (!navigator.geolocation) {
        observer.error('Géolocalisation non supportée');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next(position);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Observe les changements de position en continu.
   */
  watchPosition(): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      if (!navigator.geolocation) {
        observer.error('Géolocalisation non supportée');
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          observer.next(position);
        },
        (error) => {
          observer.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Nettoyage quand on se désabonne
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
   * Obtient l'adresse à partir de coordonnées (géocodage inverse)
   */
  getAddressFromCoordinates(lat: number, lng: number): Observable<string> {
    return new Observable((observer) => {
      // Utilisation de l'API OpenStreetMap Nominatim (gratuite)
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
          const address = data.display_name || 'Adresse inconnue';
          observer.next(address);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
}
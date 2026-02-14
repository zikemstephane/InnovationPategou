// services/sync.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { Toast } from '@capacitor/toast';
import { OfflineDbService } from './offline-db-service'; // Correction du nom de fichier
import { RideService } from './ride';// Correction du nom de fichier
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isOnline = true;
  private syncInProgress = false;
  private platform: string = 'web';

  constructor(
    private offlineDb: OfflineDbService,
    private rideService: RideService,
    private ngZone: NgZone
  ) {
    this.initPlatform();
    this.initNetworkListener();
  }

  private async initPlatform() {
    try {
      const info = await Device.getInfo();
      this.platform = info.platform;
    } catch (error) {
      console.error('❌ Erreur initPlatform:', error);
    }
  }

  private async initNetworkListener() {
    try {
      const status = await Network.getStatus();
      this.isOnline = status.connected;

      Network.addListener('networkStatusChange', (status: any) => {
        this.ngZone.run(() => {
          this.isOnline = status.connected;
          console.log('🌐 Changement réseau:', status.connected ? 'Connecté' : 'Déconnecté');
          
          if (this.isOnline) {
            this.showToast('Connexion rétablie - Synchronisation...');
            this.syncData();
          } else {
            this.showToast('Mode hors-ligne activé');
          }
        });
      });
    } catch (error) {
      console.error('❌ Erreur initialisation listener réseau:', error);
    }
  }

  private async showToast(message: string) {
    try {
      if (this.platform !== 'web') {
        await Toast.show({ text: message, duration: 'short' });
      } else {
        console.log('Toast:', message);
      }
    } catch (error) {
      console.log('Message:', message);
    }
  }

  async syncData(): Promise<boolean> {
    if (!this.isOnline || this.syncInProgress) {
      console.log('⏸️ Synchronisation ignorée:', { isOnline: this.isOnline, syncInProgress: this.syncInProgress });
      return false;
    }

    this.syncInProgress = true;
    console.log('🔄 Début synchronisation...');

    try {
      const unsynced = await this.offlineDb.getUnsyncedData();
      let syncedCount = 0;

      // Synchroniser les courses
      if (unsynced.rides.length > 0) {
        console.log(`📤 Synchronisation de ${unsynced.rides.length} course(s)...`);
        
        for (const ride of unsynced.rides) {
          try {
            // Convertir le format DB vers format API
            const rideData = this.prepareRideForSync(ride);
            
            // Appel API (à adapter selon votre service)
            await this.rideService.createRide(rideData).toPromise();
            
            await this.offlineDb.markAsSynced('rides', [ride.id]);
            syncedCount++;
          } catch (error: any) {
            console.error('❌ Erreur synchro course:', ride.id, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.offlineDb.logSyncError('ride', ride.id, errorMessage);
          }
        }
      }

      // Synchroniser les chauffeurs
      if (unsynced.chauffeurs.length > 0) {
        console.log(`📤 Synchronisation de ${unsynced.chauffeurs.length} chauffeur(s)...`);
        // Logique de synchronisation des chauffeurs
        for (const chauffeur of unsynced.chauffeurs) {
          try {
            // Implémenter la logique de synchronisation des chauffeurs
            // await this.driverService.updateDriver(chauffeur).toPromise();
            await this.offlineDb.markAsSynced('chauffeurs', [chauffeur.id]);
            syncedCount++;
          } catch (error: any) {
            console.error('❌ Erreur synchro chauffeur:', chauffeur.id, error);
          }
        }
      }

      // Synchroniser les favoris
      if (unsynced.favorites.length > 0) {
        console.log(`📤 Synchronisation de ${unsynced.favorites.length} favori(s)...`);
        for (const favorite of unsynced.favorites) {
          try {
            // Implémenter la logique de synchronisation des favoris
            await this.offlineDb.markAsSynced('favorite_addresses', [favorite.id]);
            syncedCount++;
          } catch (error: any) {
            console.error('❌ Erreur synchro favori:', favorite.id, error);
          }
        }
      }

      console.log(`✅ Synchronisation terminée: ${syncedCount} éléments synchronisés`);
      if (syncedCount > 0) {
        await this.showToast(`Synchronisation terminée (${syncedCount} éléments)`);
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ Erreur synchronisation:', error);
      await this.showToast('Erreur de synchronisation');
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private prepareRideForSync(dbRide: any): any {
    return {
      id: dbRide.id,
      client_id: dbRide.client_id,
      chauffeur_id: dbRide.chauffeur_id,
      adresse_depart: dbRide.adresse_depart,
      adresse_arrivee: dbRide.adresse_arrivee,
      prix: dbRide.prix,
      distance_km: dbRide.distance_km,
      duree_estimee: dbRide.duree_estimee,
      duree_reelle: dbRide.duree_reelle,
      statut: dbRide.statut,
      methode_paiement: dbRide.methode_paiement,
      est_payee: dbRide.est_payee === 1,
      date_demande: dbRide.date_demande,
      point_depart: {
        latitude: dbRide.point_depart_lat,
        longitude: dbRide.point_depart_lng
      },
      point_arrivee: {
        latitude: dbRide.point_arrivee_lat,
        longitude: dbRide.point_arrivee_lng
      }
    };
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  getConnectionStatus(): Observable<boolean> {
    return from(Network.getStatus()).pipe(
      switchMap(status => of(status.connected)),
      catchError(() => of(false))
    );
  }

  async forceSync(): Promise<boolean> {
    if (!this.isOnline) {
      await this.showToast('Pas de connexion internet');
      return false;
    }
    return this.syncData();
  }
}
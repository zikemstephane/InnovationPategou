// services/offline-db.service.ts
import { Injectable, NgZone } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Toast } from '@capacitor/toast';

// Interface pour la base de données
export interface SQLiteError {
  message: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineDbService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'moovcity_db';
  private isWeb = false;
  private isNative = false;
  private isInitialized = false;

  constructor(private ngZone: NgZone) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.checkPlatform();
  }

  private async checkPlatform() {
    try {
      const info = await Device.getInfo();
      this.isNative = info.platform !== 'web';
      this.isWeb = info.platform === 'web';
      console.log(`📱 Plateforme: ${info.platform}, Native: ${this.isNative}, Web: ${this.isWeb}`);
    } catch (error) {
      console.error('Erreur checkPlatform:', error);
    }
  }

  private async showToast(message: string) {
    try {
      await Toast.show({ text: message, duration: 'short' });
    } catch (error) {
      console.log('Toast message:', message);
    }
  }

  async initializeDatabase(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await this.checkPlatform();

      if (this.isWeb) {
        console.log('🌐 Mode Web - Utilisation d\'IndexedDB via SQLite');
      } else {
        console.log('📱 Mode Native - Utilisation de SQLite natif');
      }

      // Créer la base de données avec les options appropriées selon la plateforme
      await this.sqlite.createConnection(
        this.dbName,     // database name
        false,           // readonly
        'no-encryption', // mode
        1,               // version
        false            // vUpgrade
      );

      // Récupérer la connexion avec le paramètre readonly requis
      this.db = await this.sqlite.retrieveConnection(this.dbName, false);

      // Vérifier si la base existe et créer les tables si nécessaire
      await this.createTables();

      this.isInitialized = true;
      console.log('✅ Base de données initialisée avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation DB:', error instanceof Error ? error.message : String(error));
      await this.showToast('Erreur initialisation base de données');
      return false;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Activer les clés étrangères
      await this.db.execute('PRAGMA foreign_keys = ON;').catch(() => {});

      // Table des courses
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS rides (
          id INTEGER PRIMARY KEY,
          client_id INTEGER NOT NULL,
          chauffeur_id INTEGER,
          adresse_depart TEXT NOT NULL,
          adresse_arrivee TEXT NOT NULL,
          prix REAL,
          distance_km REAL,
          duree_estimee TEXT,
          duree_reelle TEXT,
          statut TEXT NOT NULL,
          methode_paiement TEXT,
          est_payee INTEGER DEFAULT 0,
          date_demande TEXT NOT NULL,
          date_acceptation TEXT,
          date_debut TEXT,
          date_fin TEXT,
          point_depart_lat REAL,
          point_depart_lng REAL,
          point_arrivee_lat REAL,
          point_arrivee_lng REAL,
          synchronise INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Table des chauffeurs
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS chauffeurs (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          photo TEXT,
          phone_number TEXT,
          rating REAL,
          est_en_ligne INTEGER DEFAULT 0,
          position_lat REAL,
          position_lng REAL,
          synchronise INTEGER DEFAULT 0,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Table des clients
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          photo TEXT,
          phone_number TEXT,
          synchronise INTEGER DEFAULT 0,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Table des véhicules
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY,
          chauffeur_id INTEGER UNIQUE,
          marque TEXT,
          modele TEXT,
          type_vehicule TEXT,
          immatriculation TEXT,
          couleur TEXT,
          photo TEXT,
          synchronise INTEGER DEFAULT 0,
          FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs (id) ON DELETE CASCADE
        );
      `);

      // Table des adresses favorites
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS favorite_addresses (
          id TEXT PRIMARY KEY,
          client_id INTEGER,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          icon TEXT,
          synchronise INTEGER DEFAULT 0,
          FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
        );
      `);

      // Table des préférences utilisateur
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE,
          default_payment_method TEXT,
          default_vehicle_type TEXT,
          notifications_enabled INTEGER DEFAULT 1,
          theme TEXT DEFAULT 'light',
          language TEXT DEFAULT 'fr',
          synchronise INTEGER DEFAULT 0
        );
      `);

      // Table de cache des recherches
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS search_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT UNIQUE,
          results TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Table des erreurs de synchronisation
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sync_errors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL,
          entity_id INTEGER,
          error TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ Tables créées avec succès');
    } catch (error) {
      console.error('❌ Erreur création tables:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // ================================
  // CRUD Courses
  // ================================

  async saveRide(ride: any): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Vérifier si la course existe déjà
      const existing = await this.getRideById(ride.id);
      
      if (existing) {
        // Mise à jour
        await this.updateRide(ride);
      } else {
        // Insertion
        await this.insertRide(ride);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde course:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async insertRide(ride: any): Promise<void> {
    const query = `
      INSERT INTO rides (
        id, client_id, chauffeur_id, adresse_depart, adresse_arrivee,
        prix, distance_km, duree_estimee, duree_reelle, statut,
        methode_paiement, est_payee, date_demande, date_acceptation,
        date_debut, date_fin, point_depart_lat, point_depart_lng,
        point_arrivee_lat, point_arrivee_lng, synchronise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      ride.id,
      ride.client_id,
      ride.chauffeur?.id || null,
      ride.adresse_depart,
      ride.adresse_arrivee,
      ride.prix || null,
      ride.distance_km || null,
      ride.duree_estimee || null,
      ride.duree_reelle || null,
      ride.statut,
      ride.methode_paiement || null,
      ride.est_payee ? 1 : 0,
      ride.date_demande,
      ride.date_acceptation || null,
      ride.date_debut || null,
      ride.date_fin || null,
      ride.point_depart?.latitude || null,
      ride.point_depart?.longitude || null,
      ride.point_arrivee?.latitude || null,
      ride.point_arrivee?.longitude || null,
      0 // synchronise = 0 (pas encore envoyé au serveur)
    ];

    await this.db!.run(query, values);
  }

  private async updateRide(ride: any): Promise<void> {
    const query = `
      UPDATE rides SET
        client_id = ?,
        chauffeur_id = ?,
        adresse_depart = ?,
        adresse_arrivee = ?,
        prix = ?,
        distance_km = ?,
        duree_estimee = ?,
        duree_reelle = ?,
        statut = ?,
        methode_paiement = ?,
        est_payee = ?,
        date_acceptation = ?,
        date_debut = ?,
        date_fin = ?,
        point_depart_lat = ?,
        point_depart_lng = ?,
        point_arrivee_lat = ?,
        point_arrivee_lng = ?,
        synchronise = ?
      WHERE id = ?
    `;

    const values = [
      ride.client_id,
      ride.chauffeur?.id || null,
      ride.adresse_depart,
      ride.adresse_arrivee,
      ride.prix || null,
      ride.distance_km || null,
      ride.duree_estimee || null,
      ride.duree_reelle || null,
      ride.statut,
      ride.methode_paiement || null,
      ride.est_payee ? 1 : 0,
      ride.date_acceptation || null,
      ride.date_debut || null,
      ride.date_fin || null,
      ride.point_depart?.latitude || null,
      ride.point_depart?.longitude || null,
      ride.point_arrivee?.latitude || null,
      ride.point_arrivee?.longitude || null,
      0,
      ride.id
    ];

    await this.db!.run(query, values);
  }

  async getRides(limit: number = 20, offset: number = 0): Promise<any[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const query = `
        SELECT r.*, 
               c.name as chauffeur_name, 
               c.photo as chauffeur_photo, 
               c.rating,
               v.marque, 
               v.modele, 
               v.type_vehicule, 
               v.immatriculation
        FROM rides r
        LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
        LEFT JOIN vehicles v ON c.id = v.chauffeur_id
        ORDER BY r.date_demande DESC
        LIMIT ? OFFSET ?
      `;

      const result = await this.db.query(query, [limit, offset]);
      
      // Transformer les résultats
      return (result.values || []).map(row => this.mapRideFromDb(row));
    } catch (error) {
      console.error('❌ Erreur récupération courses:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async getRideById(id: number): Promise<any | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const query = `
        SELECT r.*, 
               c.name as chauffeur_name, 
               c.photo as chauffeur_photo, 
               c.phone_number, 
               c.rating,
               c.position_lat,
               c.position_lng,
               v.marque, 
               v.modele, 
               v.type_vehicule, 
               v.immatriculation,
               v.couleur,
               cl.name as client_name, 
               cl.photo as client_photo,
               cl.email as client_email
        FROM rides r
        LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
        LEFT JOIN vehicles v ON c.id = v.chauffeur_id
        LEFT JOIN clients cl ON r.client_id = cl.id
        WHERE r.id = ?
      `;

      const result = await this.db.query(query, [id]);
      
      if (result.values && result.values.length > 0) {
        return this.mapRideFromDb(result.values[0]);
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération course:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private mapRideFromDb(row: any): any {
    return {
      id: row.id,
      client_id: row.client_id,
      chauffeur: row.chauffeur_id ? {
        id: row.chauffeur_id,
        name: row.chauffeur_name,
        photo: row.chauffeur_photo,
        phone_number: row.phone_number,
        rating: row.rating,
        position_actuelle: row.position_lat ? {
          latitude: row.position_lat,
          longitude: row.position_lng
        } : null
      } : null,
      adresse_depart: row.adresse_depart,
      adresse_arrivee: row.adresse_arrivee,
      prix: row.prix,
      distance_km: row.distance_km,
      duree_estimee: row.duree_estimee,
      duree_reelle: row.duree_reelle,
      statut: row.statut,
      methode_paiement: row.methode_paiement,
      est_payee: row.est_payee === 1,
      date_demande: row.date_demande,
      date_acceptation: row.date_acceptation,
      date_debut: row.date_debut,
      date_fin: row.date_fin,
      point_depart: row.point_depart_lat ? {
        latitude: row.point_depart_lat,
        longitude: row.point_depart_lng
      } : null,
      point_arrivee: row.point_arrivee_lat ? {
        latitude: row.point_arrivee_lat,
        longitude: row.point_arrivee_lng
      } : null,
      vehicle: row.marque ? {
        marque: row.marque,
        modele: row.modele,
        type_vehicule: row.type_vehicule,
        immatriculation: row.immatriculation,
        couleur: row.couleur
      } : null,
      client: {
        name: row.client_name,
        photo: row.client_photo,
        email: row.client_email
      }
    };
  }

  async deleteRide(id: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');
    await this.db.run('DELETE FROM rides WHERE id = ?', [id]);
  }

  // ================================
  // CRUD Chauffeurs
  // ================================

  async saveChauffeur(chauffeur: any): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const query = `
        INSERT OR REPLACE INTO chauffeurs (
          id, name, photo, phone_number, rating, 
          est_en_ligne, position_lat, position_lng, synchronise
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        chauffeur.id,
        chauffeur.name,
        chauffeur.photo || null,
        chauffeur.phone_number || null,
        chauffeur.rating || null,
        chauffeur.est_en_ligne ? 1 : 0,
        chauffeur.position_actuelle?.latitude || null,
        chauffeur.position_actuelle?.longitude || null,
        0
      ];

      await this.db.run(query, values);
    } catch (error) {
      console.error('❌ Erreur sauvegarde chauffeur:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async updateChauffeurPosition(id: number, lat: number, lng: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      await this.db.run(
        'UPDATE chauffeurs SET position_lat = ?, position_lng = ?, synchronise = 0 WHERE id = ?',
        [lat, lng, id]
      );
    } catch (error) {
      console.error('❌ Erreur mise à jour position:', error instanceof Error ? error.message : String(error));
    }
  }

  async getNearbyDrivers(lat: number, lng: number, radius: number = 5): Promise<any[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Formule Haversine pour trouver les chauffeurs dans un rayon donné
      const query = `
        SELECT *,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(position_lat)) *
            cos(radians(position_lng) - radians(?)) +
            sin(radians(?)) * sin(radians(position_lat))
          )
        ) AS distance
        FROM chauffeurs
        WHERE est_en_ligne = 1 AND position_lat IS NOT NULL
        HAVING distance < ?
        ORDER BY distance
      `;

      const result = await this.db.query(query, [lat, lng, lat, radius]);
      return result.values || [];
    } catch (error) {
      console.error('❌ Erreur recherche chauffeurs:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // ================================
  // CRUD Favoris
  // ================================

  async saveFavoriteAddress(favorite: any, clientId: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const query = `
        INSERT OR REPLACE INTO favorite_addresses (
          id, client_id, name, address, latitude, longitude, icon, synchronise
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        favorite.id,
        clientId,
        favorite.name,
        favorite.address,
        favorite.latitude || null,
        favorite.longitude || null,
        favorite.icon || 'heart-outline',
        0
      ];

      await this.db.run(query, values);
    } catch (error) {
      console.error('❌ Erreur sauvegarde favori:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async getFavoriteAddresses(clientId: number): Promise<any[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const query = `
        SELECT * FROM favorite_addresses
        WHERE client_id = ?
        ORDER BY name ASC
      `;

      const result = await this.db.query(query, [clientId]);
      return result.values || [];
    } catch (error) {
      console.error('❌ Erreur récupération favoris:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async deleteFavoriteAddress(id: string): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');
    await this.db.run('DELETE FROM favorite_addresses WHERE id = ?', [id]);
  }

  // ================================
  // Cache des recherches
  // ================================

  async cacheSearchResults(query: string, results: any[]): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const cleanQuery = query.toLowerCase().trim();
      const queryStr = `
        INSERT OR REPLACE INTO search_cache (query, results, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;

      await this.db.run(queryStr, [cleanQuery, JSON.stringify(results)]);
    } catch (error) {
      console.error('❌ Erreur cache recherche:', error instanceof Error ? error.message : String(error));
    }
  }

  async getCachedSearchResults(query: string): Promise<any[] | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const cleanQuery = query.toLowerCase().trim();
      const result = await this.db.query(
        'SELECT * FROM search_cache WHERE query = ? AND created_at > datetime("now", "-7 days")',
        [cleanQuery]
      );

      if (result.values && result.values.length > 0) {
        return JSON.parse(result.values[0].results);
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération cache:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // ================================
  // Préférences utilisateur
  // ================================

  async saveUserPreferences(userId: number, prefs: any): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const query = `
        INSERT OR REPLACE INTO user_preferences (
          user_id, default_payment_method, default_vehicle_type,
          notifications_enabled, theme, language, synchronise
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.run(query, [
        userId,
        prefs.default_payment_method || 'mobile_money',
        prefs.default_vehicle_type || 'voiture',
        prefs.notifications_enabled ? 1 : 0,
        prefs.theme || 'light',
        prefs.language || 'fr',
        0
      ]);
    } catch (error) {
      console.error('❌ Erreur sauvegarde préférences:', error instanceof Error ? error.message : String(error));
    }
  }

  async getUserPreferences(userId: number): Promise<any | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const result = await this.db.query(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [userId]
      );

      if (result.values && result.values.length > 0) {
        const row = result.values[0];
        return {
          default_payment_method: row.default_payment_method,
          default_vehicle_type: row.default_vehicle_type,
          notifications_enabled: row.notifications_enabled === 1,
          theme: row.theme,
          language: row.language
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération préférences:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // ================================
  // Synchronisation
  // ================================

  async getUnsyncedData(): Promise<any> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const unsyncedRides = await this.db.query(
        'SELECT * FROM rides WHERE synchronise = 0'
      );
      
      const unsyncedChauffeurs = await this.db.query(
        'SELECT * FROM chauffeurs WHERE synchronise = 0'
      );

      const unsyncedFavorites = await this.db.query(
        'SELECT * FROM favorite_addresses WHERE synchronise = 0'
      );

      return {
        rides: unsyncedRides.values || [],
        chauffeurs: unsyncedChauffeurs.values || [],
        favorites: unsyncedFavorites.values || []
      };
    } catch (error) {
      console.error('❌ Erreur récupération données non synchronisées:', error instanceof Error ? error.message : String(error));
      return { rides: [], chauffeurs: [], favorites: [] };
    }
  }

  async markAsSynced(table: string, ids: number[]): Promise<void> {
    if (!this.db || ids.length === 0) return;

    try {
      const placeholders = ids.map(() => '?').join(',');
      await this.db.run(
        `UPDATE ${table} SET synchronise = 1 WHERE id IN (${placeholders})`,
        ids
      );
    } catch (error) {
      console.error(`❌ Erreur marquage synchronisé pour ${table}:`, error instanceof Error ? error.message : String(error));
    }
  }

  async logSyncError(entityType: string, entityId: number, error: string): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.run(
        'INSERT INTO sync_errors (entity_type, entity_id, error) VALUES (?, ?, ?)',
        [entityType, entityId, error]
      );
    } catch (err) {
      console.error('❌ Erreur journalisation erreur synchro:', err instanceof Error ? err.message : String(err));
    }
  }

  // ================================
  // Nettoyage
  // ================================

  async clearOldCache(days: number = 7): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.run(
        'DELETE FROM search_cache WHERE created_at < datetime("now", "-? days")',
        [days]
      );
    } catch (error) {
      console.error('❌ Erreur nettoyage cache:', error instanceof Error ? error.message : String(error));
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.run('DELETE FROM rides');
      await this.db.run('DELETE FROM chauffeurs');
      await this.db.run('DELETE FROM clients');
      await this.db.run('DELETE FROM vehicles');
      await this.db.run('DELETE FROM favorite_addresses');
      await this.db.run('DELETE FROM user_preferences');
      await this.db.run('DELETE FROM search_cache');
      console.log('✅ Toutes les données ont été effacées');
    } catch (error) {
      console.error('❌ Erreur effacement données:', error instanceof Error ? error.message : String(error));
    }
  }

  // ================================
  // Statistiques
  // ================================

  async getDatabaseStats(): Promise<any> {
    if (!this.db) return null;

    try {
      const ridesCount = await this.db.query('SELECT COUNT(*) as count FROM rides');
      const chauffeursCount = await this.db.query('SELECT COUNT(*) as count FROM chauffeurs');
      const clientsCount = await this.db.query('SELECT COUNT(*) as count FROM clients');
      const unsyncedCount = await this.db.query('SELECT COUNT(*) as count FROM rides WHERE synchronise = 0');

      return {
        rides: ridesCount.values?.[0]?.count || 0,
        chauffeurs: chauffeursCount.values?.[0]?.count || 0,
        clients: clientsCount.values?.[0]?.count || 0,
        unsynced: unsyncedCount.values?.[0]?.count || 0
      };
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // ================================
  // Initialisation des données mock
  // ================================

  async initMockData(): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Vérifier si des données existent déjà
      const existing = await this.db.query('SELECT COUNT(*) as count FROM clients');
      if (existing.values?.[0]?.count > 0) {
        console.log('📦 Données mock déjà présentes');
        return;
      }

      console.log('📦 Initialisation des données mock...');

      // Clients mock
      await this.db.run(`
        INSERT INTO clients (id, name, email, photo, phone_number) VALUES
        (101, 'Jean Dupont', 'jean.dupont@email.com', 'assets/icon/default-avatar.svg', '+237612345678'),
        (102, 'Marie Kouassi', 'marie.kouassi@email.com', 'assets/icon/default-avatar.svg', '+237698765432'),
        (103, 'Sophie Yao', 'sophie.yao@email.com', 'assets/icon/default-avatar.svg', '+237677889900')
      `);

      // Chauffeurs mock
      await this.db.run(`
        INSERT INTO chauffeurs (id, name, photo, phone_number, rating, est_en_ligne, position_lat, position_lng) VALUES
        (201, 'Mohamed Koné', 'assets/icon/default-avatar.svg', '+237612345679', 4.9, 1, 3.8667, 11.5167),
        (202, 'Amadou Touré', 'assets/icon/default-avatar.svg', '+237698765431', 4.8, 1, 4.0500, 9.7000),
        (203, 'Ibrahim Cissé', 'assets/icon/default-avatar.svg', '+237677889900', 4.7, 1, 4.0167, 9.7167),
        (204, 'Fatou Diop', 'assets/icon/default-avatar.svg', '+237655443322', 4.9, 1, 3.9500, 9.8000)
      `);

      // Véhicules mock
      await this.db.run(`
        INSERT INTO vehicles (id, chauffeur_id, marque, modele, type_vehicule, immatriculation, couleur, photo) VALUES
        (301, 201, 'Toyota', 'Corolla', 'voiture', 'LT123AB', 'Blanc', 'assets/icon/car.svg'),
        (302, 202, 'Honda', 'CB125', 'moto', 'LT456CD', 'Rouge', 'assets/icon/motorcycle.svg'),
        (303, 203, 'Mercedes', 'Sprinter', 'bus', 'LT789EF', 'Blanc', 'assets/icon/bus.svg'),
        (304, 204, 'Hyundai', 'i10', 'voiture', 'LT321GH', 'Bleu', 'assets/icon/car.svg')
      `);

      // Courses mock
      await this.db.run(`
        INSERT INTO rides (
          id, client_id, chauffeur_id, adresse_depart, adresse_arrivee,
          prix, distance_km, duree_estimee, duree_reelle, statut,
          methode_paiement, est_payee, date_demande, date_acceptation,
          date_debut, date_fin, point_depart_lat, point_depart_lng,
          point_arrivee_lat, point_arrivee_lng
        ) VALUES
        (
          1, 101, 201, 'Mvog-Mbi, Yaoundé', 'Akwa, Douala',
          15000, 210, '03:30:00', '03:15:00', 'terminee',
          'mobile_money', 1, datetime('now', '-1 day'), datetime('now', '-1 day', '+10 minutes'),
          datetime('now', '-1 day', '+20 minutes'), datetime('now', '-1 day', '+3 hours'),
          3.8667, 11.5167, 4.0500, 9.7000
        ),
        (
          2, 101, 202, 'Bonanjo, Douala', 'Down Beach, Limbé',
          5000, 65, '01:15:00', '01:20:00', 'terminee',
          'especes', 1, datetime('now', '-2 days'), datetime('now', '-2 days', '+5 minutes'),
          datetime('now', '-2 days', '+15 minutes'), datetime('now', '-2 days', '+1 hour'),
          4.0500, 9.7000, 4.0167, 9.2167
        ),
        (
          3, 101, 203, 'Molyko, Buéa', 'Nlongkak, Yaoundé',
          18000, 250, '04:00:00', NULL, 'en_cours',
          'wave', 0, datetime('now', '-1 hour'), datetime('now', '-55 minutes'),
          datetime('now', '-50 minutes'), NULL,
          4.1333, 9.2167, 3.8667, 11.5167
        )
      `);

      // Favoris mock
      await this.db.run(`
        INSERT INTO favorite_addresses (id, client_id, name, address, latitude, longitude, icon) VALUES
        ('1', 101, 'Maison', 'Mvog-Mbi, Yaoundé', 3.8667, 11.5167, 'home-outline'),
        ('2', 101, 'Bureau', 'Bonanjo, Douala', 4.0500, 9.7000, 'business-outline'),
        ('3', 101, 'Aéroport', 'Aéroport International, Douala', 4.0167, 9.7167, 'airplane-outline')
      `);

      console.log('✅ Données mock initialisées avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation données mock:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // ================================
  // Gestion de la connexion
  // ================================

  async isConnected(): Promise<boolean> {
    return this.db !== null;
  }

  async closeConnection(): Promise<void> {
    if (this.db) {
      try {
        await this.sqlite.closeConnection(this.dbName, false);
        this.db = null;
        this.isInitialized = false;
        console.log('🔌 Connexion base de données fermée');
      } catch (error) {
        console.error('❌ Erreur fermeture connexion:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  async vacuum(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.execute('VACUUM;');
      console.log('🧹 Base de données optimisée');
    } catch (error) {
      console.error('❌ Erreur optimisation DB:', error instanceof Error ? error.message : String(error));
    }
  }
}
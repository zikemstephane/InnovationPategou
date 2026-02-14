// ===============================
// TYPES DE BASE
// ===============================

export interface Point {
  latitude: number;
  longitude: number;
}

export type VehicleType = 'moto' | 'voiture' | 'bus';
export type PaymentMethod = 'especes' | 'carte' | 'mobile_money' | 'wave';
export type RideStatus = 'en_attente' | 'acceptee' | 'en_cours' | 'terminee' | 'annulee';

// ===============================
// REQUÊTES
// ===============================

export interface CreateRideRequest {
  point_depart: Point;
  point_arrivee: Point;
  adresse_depart: string;
  adresse_arrivee: string;
  vehicleType: VehicleType;
  instructions?: string;
  methode_paiement: 'especes' | 'carte' | 'mobile_money'; // Note: 'wave' n'est pas dans CreateRideRequest
}

export interface UpdateRideRequest {
  statut?: RideStatus;
  chauffeur_id?: number;
  vehicle_id?: number;
  date_acceptation?: string;
  date_debut?: string;
  date_fin?: string;
  prix?: number;
  distance_km?: number;
  duree_reelle?: string;
  est_payee?: boolean;
  safe_ride_code?: string;
}

// ===============================
// UTILISATEURS
// ===============================

export interface User {
  id: number;
  name: string;
  email: string;
  photo?: string;
  phone_number?: string;
  rating?: number;
}

export interface Driver extends User {
  vehicle_id?: number;
  est_en_ligne?: boolean;
  note_moyenne?: number;
  nombre_courses?: number;
}

export interface Client extends User {
  preferences?: {
    vehicle_preference?: VehicleType;
    payment_preference?: PaymentMethod;
  };
}

// ===============================
// VÉHICULES
// ===============================

export interface Vehicle {
  id: number;
  marque: string;
  modele: string;
  immatriculation: string;
  type_vehicule: VehicleType;
  couleur?: string;
  photo?: string;
  capacite: number;
}

// ===============================
// COURSE PRINCIPALE
// ===============================

export interface Ride {
  // --- Relations ---
  id: number;
  client: User;
  chauffeur?: User;
  vehicle?: Vehicle;
  average_rating?: number;

  // --- Adresses et Coordonnées ---
  point_depart: Point;
  point_arrivee: Point;
  adresse_depart: string;
  adresse_arrivee: string;

  // --- Détails de la Course ---
  prix: number;
  instructions?: string;
  distance_km?: number;
  duree_estimee?: string; // Format "HH:MM:SS"
  duree_reelle?: string;
  prix_estime?: number;

  // --- Sécurité et Paiement ---
  statut: RideStatus;
  methode_paiement: PaymentMethod;
  est_payee: boolean;
  safe_ride_code?: string;

  // --- Dates et Heures ---
  date_demande: string;
  date_acceptation?: string;
  date_debut?: string;
  date_fin?: string;
  created_at?: string;
  updated_at?: string;

  // --- Métadonnées ---
  metadata?: {
    source?: string;
    version?: string;
  };
}

// ===============================
// RÉPONSES API
// ===============================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ===============================
// STATISTIQUES
// ===============================

export interface RideStats {
  total_rides: number;
  total_distance: number;
  total_earnings: number;
  average_rating: number;
  rides_by_status: {
    en_attente: number;
    acceptee: number;
    en_cours: number;
    terminee: number;
    annulee: number;
  };
}

// ===============================
// FILTRES
// ===============================

export interface RideFilters {
  statut?: RideStatus;
  start_date?: string;
  end_date?: string;
  client_id?: number;
  chauffeur_id?: number;
  min_prix?: number;
  max_prix?: number;
}

// ===============================
// ÉNUMÉRATIONS UTILES
// ===============================

export const RideStatusLabels: Record<RideStatus, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée'
};

export const RideStatusColors: Record<RideStatus, string> = {
  en_attente: 'warning',
  acceptee: 'primary',
  en_cours: 'success',
  terminee: 'medium',
  annulee: 'danger'
};

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  especes: 'Espèces',
  carte: 'Carte bancaire',
  mobile_money: 'Mobile Money',
  wave: 'Wave'
};

export const VehicleTypeLabels: Record<VehicleType, string> = {
  moto: 'Moto',
  voiture: 'Voiture',
  bus: 'Bus'
};

// ===============================
// NOTIFICATIONS LIÉES AUX COURSES
// ===============================

export interface RideNotification {
  id: number;
  ride_id: number;
  type: 'new_ride' | 'ride_accepted' | 'ride_started' | 'ride_completed' | 'ride_cancelled';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

// ===============================
// FACTURE
// ===============================

export interface RideInvoice {
  ride_id: number;
  invoice_number: string;
  date: string;
  client: {
    name: string;
    email: string;
  };
  driver: {
    name: string;
  };
  details: {
    departure: string;
    arrival: string;
    distance: number;
    duration: string;
    base_price: number;
    total: number;
  };
  payment: {
    method: PaymentMethod;
    status: 'paid' | 'pending';
  };
}

// ===============================
// ÉVALUATIONS
// ===============================

export interface RideRating {
  ride_id: number;
  note: number;
  commentaire?: string;
  date: string;
}

// ===============================
// SUIVI EN TEMPS RÉEL
// ===============================

export interface RideTracking {
  ride_id: number;
  driver_location?: Point;
  last_update?: string;
  estimated_arrival?: string;
  estimated_distance?: number;
}
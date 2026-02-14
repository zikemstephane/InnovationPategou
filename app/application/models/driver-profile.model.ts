export interface DriverProfile {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    photo?: string;
    phone_number?: string;
  };
  photo: string;
  date_de_naissance: string;
  numero_permis: string;
  numero_piece_identite: string;
  vehicule_actuel: {
    id: number;
    marque: string;
    modele: string;
    immatriculation: string;
    type_vehicule: 'moto' | 'voiture' | 'bus';
    couleur?: string;
    photo?: string;
  };
  est_en_ligne: boolean;
  localisation_actuelle: { latitude: number; longitude: number };
  derniere_localisation: { latitude: number; longitude: number };
  total_earnings: number;
  monthly_earnings: number;
  average_rating: number;
  completion_rate: number;
  date_creation: string;
}
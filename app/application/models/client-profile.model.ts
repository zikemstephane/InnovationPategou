export interface ClientProfile {
  id: number;
  userId: number;
  photo: string;
  defaultPaymentMethod: 'especes' | 'carte' | 'mobile_money';
  savedAddresses: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }[];
  averageRating: number; // Note moyenne donnée aux chauffeurs
}
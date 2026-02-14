// src/app/core/models/payment.model.ts

export enum PaymentMethodType {
  MOBILE_MONEY = 'mobile_money',
  WAVE = 'wave',
  ORANGE_MONEY = 'orange_money',
  CARTE_BANCAIRE = 'carte_bancaire',
  ESPECES = 'especes'
}

export enum PaymentStatus {
  EN_ATTENTE = 'en_attente',
  EN_COURS = 'en_cours',
  REUSSI = 'reussi',
  ECHOUE = 'echoue',
  REMBOURSE = 'rembourse'
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  details: {
    // Pour Mobile Money / Wave / Orange Money
    provider?: string; // Ex: 'MTN', 'Orange', 'Wave'
    phoneNumber?: string;
    accountName?: string;
    
    // Pour Carte Bancaire
    last4Digits?: string;
    brand?: string; // Ex: 'Visa', 'Mastercard'
    expiryMonth?: number;
    expiryYear?: number;
    cardHolderName?: string;
  };
  dateAjout: string;
}

export interface Transaction {
  id: string;
  rideId: number;
  montant: number;
  devise: string; // 'XOF'
  methode: PaymentMethodType;
  statut: PaymentStatus;
  dateTransaction: string;
  frais?: number; // Frais de transaction
  reference?: string; // Référence de la transaction
  description?: string; // Ex: "Paiement course MoovCity"
}

export interface Wallet {
  solde: number;
  devise: string;
  derniereMiseAJour: string;
  transactions: Transaction[];
  methodsPaiement: PaymentMethod[];
}
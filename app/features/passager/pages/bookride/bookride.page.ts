import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonCard,
  IonCardContent, IonCardHeader, IonAvatar, IonCardTitle, IonList, IonSpinner
} from '@ionic/angular/standalone';

import { RideService } from 'src/app/infrastructure/services/ride';
import { Auth } from 'src/app/infrastructure/services/auth/auth';

@Component({
  selector: 'app-book-ride',
  templateUrl: './bookride.page.html',
  styleUrls: ['./bookride.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonList, IonCardTitle, IonAvatar, IonCardHeader,
    ReactiveFormsModule,
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonIcon, IonRadioGroup, IonRadio, IonCheckbox,
    IonCard, IonCardContent
  ]
})
export class BookRidePage implements OnInit {

  // --- État du composant ---
  currentStep = 1;
  totalSteps = 4;
  bookRideForm: FormGroup;
  isSubmitting = false;
  estimatedPrice: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private rideService: RideService,
    private authService: Auth,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.bookRideForm = this.formBuilder.group({
      // Étape 1: Lieux
      pickupAddress: ['', Validators.required],
      dropoffAddress: ['', Validators.required],
      // Étape 2: Options
      vehicleType: ['moto', Validators.required],
      // Étape 3: Confirmation
      confirmation: [false, Validators.requiredTrue],
      // Étape 4: Paiement
      paymentMethod: ['especes', 'mobile_money', 'carte', 'wave']
    });
  }

  ngOnInit() { }

  // --- Logique des étapes ---
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      if (this.isCurrentStepValid()) {
        if (this.currentStep === 2) {
          this.calculatePrice();
        }
        this.currentStep++;
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // --- Validation de l'étape actuelle ---
  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(this.bookRideForm.get('pickupAddress')?.invalid || this.bookRideForm.get('dropoffAddress')?.invalid);
      case 2:
        return !!(this.bookRideForm.get('vehicleType')?.invalid);
      case 3:
        return this.bookRideForm.get('confirmation')?.value === true;
      case 4:
        return !!(this.bookRideForm.get('paymentMethod')?.invalid);
      default:
        return false;
    }
  }

  // --- Calcul du prix estimé ---
  calculatePrice() {
    const vehicleType = this.bookRideForm.get('vehicleType')?.value;
    if (vehicleType === 'moto') {
      this.estimatedPrice = 1500;
    } else if (vehicleType === 'voiture') {
      this.estimatedPrice = 2500;
    } else {
      this.estimatedPrice = 2000;
    }
  }

  // --- Soumission de la réservation ---
  async submitRide() {
    if (this.bookRideForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Réservation en cours...',
        spinner: 'bubbles',
        duration: 5000
      });
      await loading.present();

      const userId = this.authService.getUserId();
      if (!userId) {
        loading.dismiss();
        console.error('Utilisateur non connecté.');
        return;
      }

      const rideData = {
        ...this.bookRideForm.value,
        client_id: userId,
        prix_estime: this.estimatedPrice,
        statut: 'en_attente'
      };

      this.rideService.createRide(rideData).subscribe({
        next: async (response) => {
          loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Succès !',
            message: 'Votre course a été demandée. Un chauffeur vous sera assigné prochainement.',
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.router.navigate(['/passenger/ride-tracking', { rideId: response.id }]);
                }
              }
            ]
          });
          await alert.present();
        },
        error: async (err) => {
          loading.dismiss();
          console.error('Erreur lors de la réservation:', err);
          const alert = await this.alertCtrl.create({
            header: 'Erreur',
            message: 'Impossible de réserver la course. Veuillez réessayer.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
    }
  }
}
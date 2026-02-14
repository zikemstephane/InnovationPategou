import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { FormControl,FormControlName } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
  IonAvatar,
  IonBadge,
  IonSkeletonText,
  IonFab
} from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';


import { Paymentservice } from 'src/app/infrastructure/services/paymentservice';
import { Auth } from 'src/app/infrastructure/services/auth/auth';
import { PaymentMethodType, PaymentStatus, Wallet } from 'src/app/application/models/payment.model';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList,
    IonItem, IonLabel, IonNote, IonButton, IonIcon, IonAvatar,
    IonBadge, IonSkeletonText, IonFab
  ]
})
export class PaymentsPage implements OnInit {

  // --- État du composant ---
  wallet: Wallet = {
    solde: 0,
    devise: 'XOF',
    derniereMiseAJour: '',
    transactions: [],
    methodsPaiement: []
  };
  isLoading = true;
  isAddingMethod = false;
  addMethodForm: FormGroup;

  constructor(
    private router: Router,
    private paymentService: Paymentservice,
    private authService: Auth,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private fb: FormBuilder
  ) {
    this.addMethodForm = fb.group({
      type: [PaymentMethodType.MOBILE_MONEY, Validators.required],
      provider: [''],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      accountName: ['', Validators.required],
      last4Digits: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      brand: ['', Validators.required],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(new Date().getFullYear()), Validators.max(new Date().getFullYear() + 10)]],
      cardHolderName: ['', Validators.required],
      isDefault: [false]
    });
  }

  ngOnInit() {
    this.loadWalletData();
  }

  // --- Chargement des données du portefeuille ---
  loadWalletData() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.paymentService.getWallet(userId).subscribe({
        next: (wallet) => {
          this.wallet = wallet;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors du chargement du portefeuille:', err);
          this.showErrorAlert('Impossible de charger vos informations de paiement.');
        }
      });
    }
  }

  // --- Gestion des méthodes de paiement ---
  async addPaymentMethod() {
    const alert = await this.alertCtrl.create({
      header: 'Ajouter une méthode de paiement',
      inputs: [
        {
          name: 'type',
          type: 'radio',
          label: 'Type',
          value: PaymentMethodType.MOBILE_MONEY,
        },
        {
          name: 'type',
          type: 'radio',
          label: 'Type',
          value: PaymentMethodType.CARTE_BANCAIRE,
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Continuer',
          handler: (alertData) => {
            this.isAddingMethod = true;
            this.addMethodForm.patchValue({ type: alertData.type });
            if (alertData.type === PaymentMethodType.CARTE_BANCAIRE) {
              this.openCardModal();
            } else {
              this.openMobileMoneyModal();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async openMobileMoneyModal() {
    const modal = await this.modalCtrl.create({
      component: 'AddMobileMoneyModal', // Créez ce composant modal
      componentProps: { form: this.addMethodForm },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      presentingElement: await this.modalCtrl.getTop()
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      this.submitPaymentMethod(data);
    }
    this.isAddingMethod = false;
  }

  async openCardModal() {
    const modal = await this.modalCtrl.create({
      component: 'AddCardModal', // Créez ce composant modal
      componentProps: { form: this.addMethodForm },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      presentingElement: await this.modalCtrl.getTop()
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      this.submitPaymentMethod(data);
    }
    this.isAddingMethod = false;
  }

 async submitPaymentMethod(methodData: any) {
    const loading = await this.loadingCtrl.create({
      message: 'Ajout de la méthode...',
    });
    await loading.present();

    const userId = this.authService.getUserId();
    this.paymentService.addPaymentMethod(userId, methodData).pipe(
      finalize(() => {
        this.isAddingMethod = false;
        loading.dismiss();
      })
    ).subscribe({
      next: () => {
        this.showSuccessAlert('Méthode de paiement ajoutée avec succès !');
        this.loadWalletData(); // Recharger les données
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout de la méthode:', err);
        this.showErrorAlert('Impossible d\'ajouter la méthode de paiement.');
      }
    });
  }

  async setDefaultMethod(methodId: string) {
    const userId = this.authService.getUserId();
    this.paymentService.setDefaultPaymentMethod(userId, methodId).subscribe({
      next: () => {
        this.showSuccessAlert('Méthode de paiement définie par défaut.');
        this.loadWalletData();
      },
      error: (err) => {
        console.error('Erreur lors de la définition par défaut:', err);
        this.showErrorAlert('Impossible de définir la méthode par défaut.');
      }
    });
  }

  async deleteMethod(methodId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Supprimer',
          handler: () => {
            const userId = this.authService.getUserId();
            this.paymentService.deletePaymentMethod(userId, methodId).subscribe({
              next: () => {
                this.showSuccessAlert('Méthode de paiement supprimée.');
                this.loadWalletData();
              },
              error: (err) => {
                console.error('Erreur lors de la suppression:', err);
                this.showErrorAlert('Impossible de supprimer la méthode.');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // --- Utilitaires d'affichage ---
  getMethodIcon(type: PaymentMethodType): string {
    switch (type) {
      case PaymentMethodType.MOBILE_MONEY: return 'phone-portrait-outline';
      case PaymentMethodType.WAVE: return 'card-outline';
      case PaymentMethodType.ORANGE_MONEY: return 'card-outline';
      case PaymentMethodType.CARTE_BANCAIRE: return 'card-outline';
      default: return 'card-outline';
    }
  }

  getMethodText(type: PaymentMethodType): string {
    switch (type) {
      case PaymentMethodType.MOBILE_MONEY: return 'Mobile Money';
      case PaymentMethodType.WAVE: return 'Wave';
      case PaymentMethodType.ORANGE_MONEY: return 'Orange Money';
      case PaymentMethodType.CARTE_BANCAIRE: return 'Carte Bancaire';
      default: return 'Autre';
    }
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.REUSSI: return 'success';
      case PaymentStatus.ECHOUE: return 'danger';
      case PaymentStatus.REMBOURSE: return 'warning';
      default: return 'medium';
    }
  }

  // --- Alertes ---
  private async showSuccessAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Succès',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Erreur',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
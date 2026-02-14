// rate-ride.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonTextarea,
  IonSpinner,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';

import { RatingService } from 'src/app/infrastructure/services/rating-service';
import { Auth } from 'src/app/infrastructure/services/auth/auth';
import { addIcons } from 'ionicons';
import {
  star, starOutline, checkmarkCircleOutline,
  timeOutline, carOutline, peopleOutline,
  thumbsUpOutline, thumbsDownOutline
} from 'ionicons/icons';
@Component({
  selector: 'app-rate-ride',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonTextarea,
    IonSpinner
  ],
  templateUrl: './rate-ride.page.html',
  styleUrls: ['./rate-ride.page.scss']
})
export class RateRidePage implements OnInit {
  rideId: number;
  driverId: number;
  driver: any = null;

  rating = 5;
  criteria = {
    punctuality: 5,
    driving: 5,
    cleanliness: 5,
    professionalism: 5
  };
  comment = '';

  isSubmitting = false;
  isSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ratingService: RatingService,
    private authService: Auth,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    this.rideId = +this.route.snapshot.paramMap.get('rideId')!;
    this.driverId = +this.route.snapshot.paramMap.get('driverId')!;

    // Mock driver data
    this.driver = {
      id: this.driverId,
      name: 'Mohamed Koné',
      photo: 'assets/icon/default-avatar.svg',
      rating: 4.9
    };

    addIcons({
      star,
      'star-outline': starOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'time-outline': timeOutline,
      'car-outline': carOutline,
      'people-outline': peopleOutline,
      'thumbs-up-outline': thumbsUpOutline,
      'thumbs-down-outline': thumbsDownOutline
    });
  }

  ngOnInit() { }

  setRating(value: number) {
    this.rating = value;
  }

  setCriterion(criterion: keyof typeof this.criteria, value: number) {
    this.criteria[criterion] = value;
  }

  getRatingLabel(rating: number): string {
    return this.ratingService.getRatingLabel(rating);
  }

  async submitRating() {
    this.isSubmitting = true;

    const clientId = this.authService.getUserId();
    if (!clientId) {
      this.showError('Utilisateur non connecté');
      this.isSubmitting = false;
      return;
    }

    this.ratingService.submitDetailedRating(
      this.rideId,
      this.driverId,
      +clientId,
      this.rating,
      this.criteria,
      this.comment
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
        this.showToast('Merci pour votre évaluation !', 'success');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError(err.message || 'Erreur lors de la soumission');
      }
    });
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Erreur',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
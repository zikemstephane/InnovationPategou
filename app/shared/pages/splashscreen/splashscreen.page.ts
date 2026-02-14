import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonToast,
  IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.page.html',
  styleUrls: ['./splashscreen.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSpinner,
    IonToast,
    CommonModule,
    FormsModule,
    TranslateModule
  ]
})
export class SplashscreenPage implements OnInit, OnDestroy {

  private loadingSteps = [
    { text: 'Initialisation...', duration: 800 },
    { text: 'Chargement des modules...', duration: 600 },
    { text: 'Connexion à la base de données...', duration: 700 },
    { text: 'Vérification des mises à jour...', duration: 500 },
    { text: 'Préparation de l\'interface...', duration: 400 },
    { text: 'Presque terminé...', duration: 300 }
  ];

  private currentStep = 0;
  private progress = 0;
  private progressInterval: any;
  private stepInterval: any;

  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.platform.ready().then(() => {
      this.startLoadingSequence();
    });
  }

  startLoadingSequence() {
    this.updateProgress(0);
    this.executeLoadingSteps();
  }

  executeLoadingSteps() {
    const stepIncrement = 100 / this.loadingSteps.length;

    this.stepInterval = setInterval(() => {
      if (this.currentStep < this.loadingSteps.length) {
        const step = this.loadingSteps[this.currentStep];
        this.updateLoadingText(step.text);

        const targetProgress = Math.min((this.currentStep + 1) * stepIncrement, 100);
        this.animateProgress(this.progress, targetProgress, step.duration);

        this.currentStep++;
      } else {
        clearInterval(this.stepInterval);
        this.completeLoading();
      }
    }, this.loadingSteps[this.currentStep]?.duration || 1000);
  }

  updateProgress(value: number) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');

    if (progressFill) {
      progressFill.style.width = `${value}%`;
    }
    if (progressPercentage) {
      progressPercentage.textContent = `${Math.round(value)}%`;
    }

    this.progress = value;
  }

  animateProgress(from: number, to: number, duration: number) {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = from + (to - from) * easeOut;

      this.updateProgress(currentValue);

      if (progress < 1) {
        this.progressInterval = requestAnimationFrame(animate);
      }
    };

    if (this.progressInterval) {
      cancelAnimationFrame(this.progressInterval);
    }

    this.progressInterval = requestAnimationFrame(animate);
  }

  updateLoadingText(text: string) {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  async completeLoading() {
    this.updateProgress(100);
    this.updateLoadingText('Terminé !');

    setTimeout(async () => {
      try {
        // Récupérer onboarding + rôle utilisateur depuis Preferences
        const { value: onboardingSeen } = await Preferences.get({ key: 'onboardingSeen' });
        const { value: userRole } = await Preferences.get({ key: 'userRole' });

        if (!onboardingSeen || onboardingSeen !== 'true') {
          // L'utilisateur n'a pas vu l'onboarding
          this.router.navigateByUrl('/onboarding1', { replaceUrl: true });
        } else {
          // Rediriger selon rôle
          if (userRole === 'chauffeur') {
            this.router.navigateByUrl('/chauffeur/home', { replaceUrl: true });
          } else if (userRole === 'passager') {
            this.router.navigateByUrl('/passager/home', { replaceUrl: true });
          } else {
            // Rôle inconnu → login
            this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        }
      } catch (err) {
        console.error('Erreur navigation Splashscreen:', err);
        this.router.navigateByUrl('/onboarding1', { replaceUrl: true });
      }
    }, 800);
  }

  ngOnDestroy() {
    if (this.stepInterval) clearInterval(this.stepInterval);
    if (this.progressInterval) cancelAnimationFrame(this.progressInterval);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { closeOutline, arrowForwardOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
@Component({
  selector: 'app-onboarding2',
  templateUrl: './onboarding2.page.html',
  styleUrls: ['./onboarding2.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule, TranslateModule]
})
export class Onboarding2Page {
  constructor(private router: Router) {
    addIcons({ closeOutline, arrowForwardOutline });
  }

  next() {
    this.router.navigate(['/onboarding3']);
  }
  skipOnboarding() {
    // Option pour passer l'onboarding et aller directement à la connexion
    this.router.navigate(['/login']);
  }
}
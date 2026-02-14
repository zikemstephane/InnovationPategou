import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { closeOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
@Component({
  selector: 'app-onboarding1',
  templateUrl: './onboarding1.page.html',
  styleUrls: ['./onboarding1.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule, TranslateModule]
})
export class Onboarding1Page {
  constructor(private router: Router) {
    addIcons({closeOutline})
  }

  next() {
    this.router.navigate(['/onboarding2']);
  }
  skipOnboarding() {
    // Option pour passer l'onboarding et aller directement à la connexion
    this.router.navigate(['/login']);
  }
}
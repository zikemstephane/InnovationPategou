import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-onboarding3',
  templateUrl: './onboarding3.page.html',
  styleUrls: ['./onboarding3.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, CommonModule, FormsModule, TranslateModule]
})
export class Onboarding3Page {
  constructor(private router: Router) {}

  start() {
    // Marquer l'onboarding comme vu et naviguer vers l'inscription
    localStorage.setItem('onboardingSeen', 'true');
    this.router.navigate(['/signup']);
  }

  login() {
    // Marquer l'onboarding comme vu et naviguer vers la connexion
    localStorage.setItem('onboardingSeen', 'true');
    this.router.navigate(['/login']);
  }
}
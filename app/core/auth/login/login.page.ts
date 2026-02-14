import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Toast } from 'src/app/infrastructure/services/toast';
import { Auth } from 'src/app/infrastructure/services/auth/auth';
import { IonHeader, IonButton, IonBackButton, IonTitle, IonContent, IonIcon, IonButtons, IonToolbar, IonItem, IonInput ,IonSpinner} from "@ionic/angular/standalone";
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [IonHeader, IonButton, IonBackButton, IonInput, IonItem, IonToolbar, IonButtons, IonIcon, IonContent, IonTitle, IonSpinner, ReactiveFormsModule, CommonModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private toastService: Toast,
    private authService: Auth
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    try {
      const { email, password } = this.loginForm.value;

      const response = await this.authService.login(email, password).toPromise();

      if (response) {
        console.log(response);
        
        // IMPORTANT: Stocker l'email dans le localStorage pour la page 2FA
        localStorage.setItem('moovcity_temp_email', email);
        
        // Si votre API retourne d'autres données temporaires
        // if (response.user) {
        //   localStorage.setItem('moovcity_temp_user', JSON.stringify(response.user));
        // }
        // if (response.tempToken) {
        //   localStorage.setItem('moovcity_temp_token', response.tempToken);
        // }

        // Afficher un message informant que le code a été envoyé
        this.toastService.showInfo(`Un code de vérification a été envoyé à ${email}`);
        
        // Naviguer vers la page de vérification 2FA
        this.router.navigate(['/two-fa']);
      }
    } catch (error: any) {
      this.toastService.showError(error.message || 'Échec de la connexion. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}
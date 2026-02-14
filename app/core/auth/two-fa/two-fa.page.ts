// two-fa.page.ts
import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonInput, IonButton, IonSpinner, IonBackButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Toast } from 'src/app/infrastructure/services/toast';
import { Auth, User } from 'src/app/infrastructure/services/auth/auth';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-two-fa',
  templateUrl: './two-fa.page.html',
  styleUrls: ['./two-fa.page.scss'],
  standalone: true,
  imports: [
    IonBackButton, 
    IonSpinner, 
    IonButton, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    CommonModule, 
    FormsModule,
    IonButtons,
    IonIcon,
    ReactiveFormsModule,
    IonInput
  ]
})
export class TwoFAPage implements OnInit {
  twoFAForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  countdown = 0;
  resendDisabled = false;
  codeInputs = ['code1', 'code2', 'code3', 'code4', 'code5', 'code6'];
  @ViewChildren('codeInput') codeInputElements!: QueryList<IonInput>;
  userEmail: string | null = null;
  user: User | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private toastService: Toast,
    private authService: Auth
  ) {
    this.twoFAForm = this.formBuilder.group({
      code1: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code2: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code3: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code4: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code5: ['', [Validators.required, Validators.pattern('[0-9]')]],
      code6: ['', [Validators.required, Validators.pattern('[0-9]')]]
    });
  }

  ngOnInit() {
    // Récupérer l'email depuis le localStorage
    this.userEmail = localStorage.getItem('moovcity_temp_email');
    
    // Récupérer les infos utilisateur si disponibles
    const tempUser = localStorage.getItem('moovcity_temp_user');
    if (tempUser) {
      this.user = JSON.parse(tempUser);
      console.log('✅ Utilisateur récupéré:', this.user);
    }

    // Si aucun email n'est trouvé, rediriger vers la page de connexion
    if (!this.userEmail && !this.user?.email) {
      this.toastService.showError('Session expirée. Veuillez vous reconnecter.');
      this.router.navigate(['/login']);
      return;
    }

    this.startCountdown();
  }

  onCodeInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Ne permettre que les chiffres
    if (value && !/^\d+$/.test(value)) {
      input.value = '';
      return;
    }

    if (value && index < this.codeInputs.length - 1) {
      const nextInput = this.codeInputElements.toArray()[index + 1];
      setTimeout(() => {
        nextInput.setFocus();
      }, 10);
    }

    if (!value && index > 0 && event.inputType === 'deleteContentBackward') {
      const prevInput = this.codeInputElements.toArray()[index - 1];
      setTimeout(() => {
        prevInput.setFocus();
      }, 10);
    }
  }

  onInputFocus(index: number) {
    const input = this.codeInputElements.toArray()[index];
    if (input) {
      input.getInputElement().then((nativeElement: HTMLInputElement) => {
        nativeElement.select();
      });
    }
  }

  async verify() {
    if (this.twoFAForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      // Combiner les 6 chiffres en un seul code
      const code = this.codeInputs.map(input => this.twoFAForm.get(input)?.value).join('');
      console.log('🔑 Code saisi:', code);

      // Utiliser l'email de l'utilisateur (priorité à l'objet user, puis à l'email stocké)
      const email = this.user?.email || this.userEmail;
      console.log('📧 Email utilisé:', email);

      if (!email) {
        throw new Error('Email non trouvé. Veuillez vous reconnecter.');
      }

      // Appeler le service de vérification avec le code et l'email
      const response = await this.authService.verify2FA(code, email).toPromise();
      console.log('✅ Réponse vérification:', response);

      if (response) {
        this.toastService.showSuccess('Vérification réussie !');
        
        // Récupérer l'utilisateur après connexion
        const currentUser = this.authService.currentUserValue;
        console.log('👤 Utilisateur connecté:', currentUser);
        
        // Nettoyer les données temporaires
        localStorage.removeItem('moovcity_temp_email');
        localStorage.removeItem('moovcity_temp_token');
        localStorage.removeItem('moovcity_temp_user');

        // Rediriger en fonction du rôle
        if (currentUser) {
          if (currentUser.role === 'chauffeur') {
            console.log('🚗 Redirection vers chauffeur');
            this.router.navigate(['/chauffeur']);
          } else if (currentUser.role === 'client') {
            console.log('👤 Redirection vers passager');
            this.router.navigate(['/passager']);
          } else {
            console.log('⚠️ Rôle inconnu, redirection vers splashscreen');
            this.router.navigate(['/splashscreen']);
          }
        } else {
          console.log('⚠️ Utilisateur non trouvé, redirection vers splashscreen');
          this.router.navigate(['/splashscreen']);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur vérification:', error);
      this.errorMessage = error.message || 'Code invalide. Veuillez réessayer.';

      // Réinitialiser les champs
      this.codeInputs.forEach(input => {
        this.twoFAForm.get(input)?.setValue('');
      });

      // Remettre le focus sur le premier champ
      if (this.codeInputElements.length > 0) {
        setTimeout(() => {
          this.codeInputElements.first.setFocus();
        }, 10);
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  async resendCode() {
    if (this.countdown > 0) {
      return;
    }

    try {
      // Utiliser l'email au lieu du tempToken
      const email = this.user?.email || this.userEmail;
      console.log('📧 Renvoi du code à:', email);

      if (!email) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      await this.authService.resend2FACode(email).toPromise();
      this.toastService.showSuccess('Code renvoyé avec succès !');
      this.startCountdown();
    } catch (error: any) {
      console.error('❌ Erreur renvoi code:', error);
      this.toastService.showError(error.message || 'Impossible de renvoyer le code. Veuillez réessayer.');
    }
  }

  startCountdown() {
    this.countdown = 60;
    this.resendDisabled = true;

    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(interval);
        this.resendDisabled = false;
      }
    }, 1000);
  }
}
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Toast } from 'src/app/infrastructure/services/toast';
import { Auth } from 'src/app/infrastructure/services/auth/auth';
import { IonHeader, IonButton, IonIcon, IonBackButton, IonToolbar, IonButtons, IonItem,IonContent,IonTitle,IonInput,IonSpinner } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  imports: [IonHeader, IonButton, IonIcon, IonBackButton, IonToolbar, IonButtons,IonItem,IonContent,IonTitle,IonInput,IonSpinner,CommonModule,FormsModule,ReactiveFormsModule]
})

export class ChangePasswordPage implements OnInit {
  changePasswordForm: FormGroup;
  showPassword = {
    current: false,
    new: false,
    confirm: false
  };
  isSubmitting = false;
  passwordStrength = {
    class: '',
    text: ''
  };
  requirements = {
    length: false,
    uppercase: false,
    number: false,
    special: false
  };

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private toastService: Toast,
    private authService: Auth
  ) {
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Écouter les changements du nouveau mot de passe
    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(value => {
      this.checkPasswordStrength(value);
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    this.showPassword[field] = !this.showPassword[field];
  }

  checkPasswordStrength(password: string) {
    // Réinitialiser les exigences
    this.requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    // Calculer la force du mot de passe
    const passedRequirements = Object.values(this.requirements).filter(Boolean).length;

    if (passedRequirements <= 1) {
      this.passwordStrength = {
        class: 'weak',
        text: 'Faible'
      };
    } else if (passedRequirements === 2) {
      this.passwordStrength = {
        class: 'fair',
        text: 'Moyen'
      };
    } else if (passedRequirements === 3) {
      this.passwordStrength = {
        class: 'good',
        text: 'Bon'
      };
    } else {
      this.passwordStrength = {
        class: 'strong',
        text: 'Fort'
      };
    }
  }

  async changePassword() {
    if (this.changePasswordForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    try {
      const { currentPassword, newPassword } = this.changePasswordForm.value;
      await this.authService.changePassword(currentPassword, newPassword);
      this.toastService.showSuccess('Mot de passe changé avec succès !');
      this.router.navigate(['/profile']);
    } catch (error: any) {
      this.toastService.showError(error.message || 'Échec du changement de mot de passe. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }
}
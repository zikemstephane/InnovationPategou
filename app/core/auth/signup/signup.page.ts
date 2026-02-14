import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import {
  IonHeader,
  IonButton,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonButtons,
  IonToolbar,
  IonItem,
  IonInput,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonCheckbox,
  IonList
} from "@ionic/angular/standalone";

import { Toast } from 'src/app/infrastructure/services/toast';
import { Auth } from 'src/app/infrastructure/services/auth/auth';

// --- Interfaces pour le typage fort ---
interface StepClasses {
  [key: string]: boolean;
}

interface ProgressIndicatorClasses {
  [key: string]: {
    active: boolean;
    completed: boolean;
  };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonButton, IonBackButton, IonInput, IonItem, IonToolbar,
    IonButtons, IonIcon, IonContent, IonTitle, IonSpinner,
    IonSelect, IonSelectOption, IonLabel, IonCheckbox,
    IonList
  ],
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {

  // --- Propriétés du composant ---
  signupForm: FormGroup;
  isSubmitting = false;
  currentStep = 1;
  totalSteps = 3;
  photoPreview: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // --- Constructeur et Injection ---
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private toastService: Toast,
    private authService: Auth,
    private cdr: ChangeDetectorRef
  ) {
    this.signupForm = this.formBuilder.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      role: ['passager', Validators.required],
      motdepasse: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', Validators.required],
      photo: [null],
      terms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {}

  // --- VALIDATEURS ---
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('motdepasse')?.value;
    const confirmPassword = form.get('password_confirm')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // --- LOGIQUE DES ÉTAPES ---
  nextStep() {
    if (this.isCurrentStepInvalid()) {
      this.markCurrentStepTouched();
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.cdr.detectChanges();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.detectChanges();
    }
  }

  // --- GESTION DES CLASSES DYNAMIQUE ---
  getStepClasses(): StepClasses {
    const classes: StepClasses = {};
    for (let i = 1; i <= this.totalSteps; i++) {
      classes[`step-${i}`] = this.currentStep === i;
    }
    return classes;
  }

  getProgressIndicatorClasses(): ProgressIndicatorClasses {
    const classes: ProgressIndicatorClasses = {};
    for (let i = 1; i <= this.totalSteps; i++) {
      classes[`step-indicator-${i}`] = {
        active: this.currentStep === i,
        completed: this.currentStep > i
      };
    }
    return classes;
  }

  // --- UTILITAIRES DE VALIDATION ---
  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  isCurrentStepInvalid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(this.signupForm.get('nom')?.invalid ||
                  this.signupForm.get('prenom')?.invalid ||
                  this.signupForm.get('email')?.invalid ||
                  this.signupForm.get('telephone')?.invalid ||
                  this.signupForm.get('role')?.invalid);
      case 2:
        return !!(this.signupForm.get('motdepasse')?.invalid ||
                  this.signupForm.get('password_confirm')?.invalid ||
                  this.signupForm.errors?.['passwordMismatch']);
      case 3:
        return !!(this.signupForm.get('terms')?.invalid);
      default:
        return true;
    }
  }

  markCurrentStepTouched() {
    switch (this.currentStep) {
      case 1:
        ['nom', 'prenom', 'email', 'telephone', 'role'].forEach(field => {
          this.signupForm.get(field)?.markAsTouched();
        });
        break;
      case 2:
        ['motdepasse', 'password_confirm'].forEach(field => {
          this.signupForm.get(field)?.markAsTouched();
        });
        break;
      case 3:
        this.signupForm.get('terms')?.markAsTouched();
        break;
    }
  }

  // --- LOGIQUE MÉTIER ---
  selectFile() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.signupForm.patchValue({ photo: file });
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async signup() {
    if (this.signupForm.invalid) {
      this.markCurrentStepTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const formData = this.signupForm.value;
      await firstValueFrom(
        this.authService.signup(
          formData.nom,
          formData.prenom,
          formData.email,
          formData.telephone,
          formData.role,
          formData.motdepasse,
          formData.password_confirm,
          formData.photo
        )
      );
      this.toastService.showSuccess('Inscription réussie !');
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.toastService.showError(error.message || 'Échec de l\'inscription.');
    } finally {
      this.isSubmitting = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  showTerms(event: Event) {
    event.preventDefault();
    console.log('Afficher les conditions d\'utilisation');
  }

  showPrivacy(event: Event) {
    event.preventDefault();
    console.log('Afficher la politique de confidentialité');
  }
}
// settings.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonBackButton, IonButtons, IonList, IonItem, 
  IonLabel, IonIcon, IonToggle, IonButton,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { Auth, User } from 'src/app/infrastructure/services/auth/auth';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonBackButton, IonButtons, IonList, IonItem,
    IonLabel, IonIcon, IonToggle, IonButton
  ]
})
export class SettingsPage implements OnInit {
  user: User | null = null;
  
  // Paramètres utilisateur
  settings = {
    newRideNotifications: true,
    messageNotifications: true,
    promotionNotifications: false
  };

  // Options de langue
  languages: Language[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  currentLanguage = this.languages[0];
  currentCurrency = 'XOF (CFA)';
  currentDateFormat = 'DD/MM/YYYY';

  constructor(
    private router: Router,
    private authService: Auth,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
  }

  private loadUserData() {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
    });
  }

  private loadSettings() {
    // Charger les paramètres depuis le localStorage ou le backend
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }

    const savedLanguage = localStorage.getItem('app_language');
    if (savedLanguage) {
      const lang = this.languages.find(l => l.code === savedLanguage);
      if (lang) this.currentLanguage = lang;
    }
  }

  private saveSettings() {
    localStorage.setItem('user_settings', JSON.stringify(this.settings));
  }

  // Sélection de la langue
  async selectLanguage() {
    const alert = await this.alertCtrl.create({
      header: 'Choisir la langue',
      inputs: this.languages.map(lang => ({
        type: 'radio',
        label: `${lang.flag} ${lang.name}`,
        value: lang.code,
        checked: lang.code === this.currentLanguage.code
      })),
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: (langCode) => {
            const selected = this.languages.find(l => l.code === langCode);
            if (selected) {
              this.currentLanguage = selected;
              localStorage.setItem('app_language', langCode);
              this.showToast('Langue modifiée avec succès');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Sélection de la devise
  async selectCurrency() {
    const currencies = ['XOF (CFA)', 'EUR (€)', 'USD ($)', 'NGN (₦)'];
    const alert = await this.alertCtrl.create({
      header: 'Choisir la devise',
      inputs: currencies.map(curr => ({
        type: 'radio',
        label: curr,
        value: curr,
        checked: curr === this.currentCurrency
      })),
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'OK',
          handler: (currency) => {
            this.currentCurrency = currency;
            localStorage.setItem('app_currency', currency);
            this.showToast('Devise modifiée avec succès');
          }
        }
      ]
    });
    await alert.present();
  }

  // Sélection du format de date
  async selectDateFormat() {
    const formats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
    const alert = await this.alertCtrl.create({
      header: 'Format de la date',
      inputs: formats.map(f => ({
        type: 'radio',
        label: f,
        value: f,
        checked: f === this.currentDateFormat
      })),
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'OK',
          handler: (format) => {
            this.currentDateFormat = format;
            localStorage.setItem('app_date_format', format);
            this.showToast('Format de date modifié');
          }
        }
      ]
    });
    await alert.present();
  }

  // Changer la photo de profil
  async changePhoto() {
    const alert = await this.alertCtrl.create({
      header: 'Photo de profil',
      message: 'Choisir une nouvelle photo',
      buttons: [
        {
          text: 'Prendre une photo',
          handler: () => {
            // Implémenter la caméra
            console.log('Ouvrir caméra');
          }
        },
        {
          text: 'Choisir dans la galerie',
          handler: () => {
            // Implémenter la galerie
            console.log('Ouvrir galerie');
          }
        },
        {
          text: 'Annuler',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  // Changer le mot de passe
  async changePassword() {
    const alert = await this.alertCtrl.create({
      header: 'Changer le mot de passe',
      inputs: [
        {
          name: 'current',
          type: 'password',
          placeholder: 'Mot de passe actuel'
        },
        {
          name: 'new',
          type: 'password',
          placeholder: 'Nouveau mot de passe'
        },
        {
          name: 'confirm',
          type: 'password',
          placeholder: 'Confirmer le mot de passe'
        }
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Valider',
          handler: (data) => {
            if (data.new !== data.confirm) {
              this.showToast('Les mots de passe ne correspondent pas', 'danger');
              return false;
            }
            // Appeler le service de changement de mot de passe
            console.log('Changer mot de passe', data);
            this.showToast('Mot de passe modifié avec succès');
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  // Gérer la confidentialité
  managePrivacy() {
    this.router.navigate(['/privacy']);
  }

  // Gérer les appareils connectés
  manageDevices() {
    this.router.navigate(['/devices']);
  }

  // Ouvrir les conditions d'utilisation
  openTerms() {
    this.router.navigate(['/terms']);
  }

  // Ouvrir la politique de confidentialité
  openPrivacyPolicy() {
    this.router.navigate(['/privacy-policy']);
  }

  // Déconnexion
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Se déconnecter',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
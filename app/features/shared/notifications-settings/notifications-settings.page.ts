import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonNote,
  IonButton,
  IonIcon, IonSelectOption,IonListHeader
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-notifications-settings',
  templateUrl: './notifications-settings.page.html',
  styleUrls: ['./notifications-settings.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonItem, IonLabel, IonToggle, IonList, IonRadioGroup, IonRadio,
    IonNote, IonButton,IonIcon,IonSelectOption,IonListHeader
  ]
})
export class NotificationsSettingsPage implements OnInit {

  settingsForm: FormGroup;
  soundOptions = [
    { label: 'Par défaut', value: 'default' },
    { label: 'Son 1 (Doux)', value: 'sound1' },
    { label: 'Son 2 (Moyen)', value: 'sound2' },
    { label: 'Son 3 (Énergique)', value: 'sound3' },
    { label: 'Silencieux', value: 'silent' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    this.settingsForm = this.formBuilder.group({
      pushEnabled: [true, Validators.required],
      newRideEnabled: [true, Validators.required],
      paymentEnabled: [true, Validators.required],
      messageSound: ['default', Validators.required],
      dndEnabled: [true],
      dndSound: ['default', Validators.required],
      doNotDisturb: [false]
    });
  }

  ngOnInit() {
    // Charger les paramètres sauvegardés (simulation)
    this.loadSavedSettings();
  }

  loadSavedSettings() {
    // Dans une vraie app, vous chargeriez depuis le localStorage ou une API
    const savedSettings = {
      pushEnabled: true,
      newRideEnabled: true,
      paymentEnabled: true,
      messageSound: 'sound1',
      dndEnabled: true,
      dndSound: 'default',
      doNotDisturb: false
    };
    this.settingsForm.patchValue(savedSettings);
  }

  async saveSettings() {
    if (this.settingsForm.valid) {
      // Sauvegarder les paramètres (simulation)
      console.log('💾 Paramètres sauvegardés:', this.settingsForm.value);
      
      const alert = await this.alertCtrl.create({
        header: 'Succès',
        message: 'Vos préférences de notification ont été enregistrées.',
        buttons: ['OK']
      });
      await alert.present();

      this.router.navigate(['/driver/home']);
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Erreur',
        message: 'Veuillez vérifier vos préférences.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async resetToDefaults() {
    const alert = await this.alertCtrl.create({
      header: 'Réinitialiser',
      message: 'Êtes-vous sûr de vouloir réinitialiser tous les paramètres à leurs valeurs par défaut ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Réinitialiser',
          handler: () => {
            this.settingsForm.reset({
              pushEnabled: true,
              newRideEnabled: true,
              paymentEnabled: true,
              messageSound: 'default',
              dndEnabled: true,
              dndSound: 'default',
              doNotDisturb: false
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async openSoundLibrary() {
    // Ici, vous pourriez ouvrir une modale pour pré-écouter les sons
    console.log('🎵 Ouverture de la bibliothèque de sons');
    const alert = await this.alertCtrl.create({
      header: 'Bibliothèque de Sons',
      message: 'Écoutez et choisissez votre son de notification préféré.',
      buttons: ['Fermer']
    });
    await alert.present();
  }
}
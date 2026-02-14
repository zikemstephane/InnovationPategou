import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';

/**
 * Service centralisé pour afficher des messages à l'utilisateur.
 * Gère les toasts (notifications rapides) et les alerts (boîtes de dialogue).
 */
@Injectable({
  providedIn: 'root',
})
export class Toast {
  constructor(
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  /**
   * Affiche un message de succès (vert).
   * @param message Le message à afficher.
   * @param duration Durée d'affichage en millisecondes (défaut: 3000).
   */
  async showSuccess(message: string, duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'success', // Utilise la couleur verte du thème
      icon: 'checkmark-circle-outline',
      position: 'bottom',
      cssClass: 'custom-toast' // Classe CSS pour un style personnalisé si besoin
    });
    await toast.present();
  }

  /**
   * Affiche un message d'erreur (rouge).
   * @param message Le message d'erreur.
   * @param duration Durée d'affichage en millisecondes (défaut: 4000, plus long pour lire l'erreur).
   */
  async showError(message: string, duration: number = 4000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'danger',
      icon: 'alert-circle-outline',
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  /**
   * Affiche un message d'information (bleu/gris).
   * @param message Le message d'information.
   * @param duration Durée d'affichage en millisecondes.
   */
  async showInfo(message: string, duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'medium',
      icon: 'information-circle-outline',
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  /**
   * Affiche une boîte de dialogue de confirmation.
   * Retourne `true` si l'utilisateur confirme, `false` sinon.
   * @param header Titre de la boîte de dialogue.
   * @param message Message à afficher.
   * @param confirmText Texte du bouton de confirmation (défaut: "Confirmer").
   * @param cancelText Texte du bouton d'annulation (défaut: "Annuler").
   */
  async showConfirm(
    header: string, 
    message: string, 
    confirmText: string = 'Confirmer',
    cancelText: string = 'Annuler'
  ): Promise<boolean> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: confirmText,
          handler: () => {
            return true; // Résout la promesse avec `true`
          }
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }
}

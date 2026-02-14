import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core'; // Ajoutez cette ligne pour le service de traduction

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private translate: TranslateService) { // Injectez TranslateService
    // Détectez la langue de l'appareil et définissez-la
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang?.match(/en|fr/) ? browserLang : 'fr'); // Français par défaut, anglais si détecté
  }
}
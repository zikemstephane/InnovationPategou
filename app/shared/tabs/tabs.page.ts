import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  swapHorizontalOutline,
  settingsOutline,
  cashOutline,
  peopleOutline,
  add
} from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { Auth, UserRole } from 'src/app/infrastructure/services/auth/auth';
import { TabItem } from 'src/app/application/models/tabs';


@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    CommonModule,
    RouterLink
  ]
})
export class TabsPage implements OnInit {

  tabs: TabItem[] = [];
  userRole!: UserRole;

  constructor(private auth: Auth) {
    addIcons({homeOutline,
  swapHorizontalOutline,
  settingsOutline,
  cashOutline,
  peopleOutline,
  add})
  }

  ngOnInit() {
    const role = this.auth.getUserRole();
    // const role = 'client';
    
    if (!role) return;

    this.userRole = role;
    this.initializeTabs(role);
  }

  private initializeTabs(role: UserRole ) {

    if (role === 'chauffeur') {
      this.tabs = [
        { label: 'Accueil', icon: 'home-outline', route: '/chauffeur/home' },
        { label: 'Courses', icon: 'people-outline', route: '/chauffeur/rides' },
        { label: 'Paramètres', icon: 'settings-outline', route: '/chauffeur/settings' }
      ];
    }

    if (role === 'client') {
      this.tabs = [
        { label: 'Accueil', icon: 'home-outline', route: '/passager/home' },
        { label: 'Mes trajets', icon: 'swap-horizontal-outline', route: '/passager/trips' },
        { label: 'Paiements', icon: 'cash-outline', route: '/passager/payments' },
        { label: 'Paramètres', icon: 'settings-outline', route: '/passager/settings' }
      ];
    }
  }
}


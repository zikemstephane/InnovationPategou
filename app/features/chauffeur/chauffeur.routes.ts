import { Routes } from '@angular/router';
import { SettingsPage } from '../shared/settings/settings.page';

export const CHAUFFEUR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'rides',
        loadComponent: () =>
          import('./pages/rides/rides.page').then(m => m.RidesPage)
      },
      {
        path: 'settings',
        component: SettingsPage
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];

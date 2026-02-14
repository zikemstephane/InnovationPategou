import { Routes } from '@angular/router';
import { SettingsPage } from '../shared/settings/settings.page';
import { HomeP } from './pages/homep/homep.page';
import { CreateRidePage } from './pages/create-ride/create-ride.page';

export const PASSAGER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        component:HomeP
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./pages/trips/trips.page').then(m => m.TripsPage)
      },
      // {
      //   path: 'payments',
      //   loadComponent: () =>
      //     import('./pages/payments/payments.page').then(m => m.PaymentsPage)
      // },

      {
        path: 'settings',
        component:SettingsPage
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'create-ride',
    component: CreateRidePage
  }
];

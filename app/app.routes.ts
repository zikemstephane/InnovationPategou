import { Routes } from '@angular/router';
import { CHAUFFEUR_ROUTES } from './features/chauffeur/chauffeur.routes';
import { PASSAGER_ROUTES } from './features/passager/passager.routes';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'splashscreen',
    pathMatch: 'full',
  },
  {
    path: 'splashscreen',
    loadComponent: () =>
      import('./shared/pages/splashscreen/splashscreen.page')
        .then(m => m.SplashscreenPage)
  },
  {
    path: 'chauffeur',
    children: CHAUFFEUR_ROUTES
  },
  {
    path: 'passager',
    children: PASSAGER_ROUTES
  },
  {
    path: 'onboarding1',
    loadComponent: () => import('./shared/pages/onboarding1/onboarding1.page').then( m => m.Onboarding1Page)
  },
  {
    path: 'onboarding2',
    loadComponent: () => import('./shared/pages/onboarding2/onboarding2.page').then( m => m.Onboarding2Page)
  },
  {
    path: 'onboarding3',
    loadComponent: () => import('./shared/pages/onboarding3/onboarding3.page').then( m => m.Onboarding3Page)
  }
  ,
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./core/auth/signup/signup.page').then( m => m.SignupPage)
  },
  {
    path: 'two-fa',
    loadComponent: () => import('./core/auth/two-fa/two-fa.page').then( m => m.TwoFAPage)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./core/auth/change-password/change-password.page').then( m => m.ChangePasswordPage)
  },
  
  
  {
    path: 'notifications-settings',
    loadComponent: () => import('./features/shared/notifications-settings/notifications-settings.page').then( m => m.NotificationsSettingsPage)
  },
  {
    path: '**',
    redirectTo: 'splashscreen'
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/shared/notifications/notifications.page').then( m => m.NotificationsPage)
  },
];

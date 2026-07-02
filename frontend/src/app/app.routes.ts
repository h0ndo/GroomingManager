import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Dashboard } from './pages/dashboard/dashboard';
import { RolePage } from './pages/role-page/role-page';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  {
    path: 'admin',
    component: RolePage,
    canActivate: [roleGuard('ROLE_admin')],
    data: {
      eyebrow: 'Admin-Bereich',
      title: 'Admin Cockpit',
      roleLabel: 'Admin',
      description: 'Platzhalter für Benutzerverwaltung, Mandanten-Einstellungen und Kundenorganisation-Konfiguration.',
      tagSeverity: 'success',
      items: ['Benutzer und Rollen verwalten', 'Kundenorganisation-Stammdaten pflegen', 'System- und Kundeninstanz-Einstellungen prüfen'],
    },
  },
  {
    path: 'fuehrungskraft',
    component: RolePage,
    canActivate: [roleGuard('ROLE_fuehrungskraft')],
    data: {
      eyebrow: 'Führungskraft-Bereich',
      title: 'Führungskraft Cockpit',
      roleLabel: 'Führungskraft',
      description: 'Platzhalter für Teamsteuerung, Kapazitätsüberblick und operative Entscheidungen.',
      tagSeverity: 'info',
      items: ['Team-Auslastung prüfen', 'Angestellte und Termine koordinieren', 'Kapazitäts- und Anfrageübersicht steuern'],
    },
  },
  {
    path: 'angestellter',
    component: RolePage,
    canActivate: [roleGuard('ROLE_angestellter')],
    data: {
      eyebrow: 'Angestellte-Bereich',
      title: 'Angestellte Arbeitsplatz',
      roleLabel: 'Angestellte:r',
      description: 'Platzhalter für Tagesplan, Kund:innen-Akten und Vorgangsdokumentation.',
      tagSeverity: 'info',
      items: ['Tagesplan und Termine sehen', 'Kund:innen-Kontext öffnen', 'Vorgang und Dokumente dokumentieren'],
    },
  },
  {
    path: 'kunde',
    component: RolePage,
    canActivate: [roleGuard('ROLE_kunde')],
    data: {
      eyebrow: 'Kund:innen-Bereich',
      title: 'Kund:innen Portal',
      roleLabel: 'Kund:in',
      description: 'Platzhalter für Termine, Dokumente, Dokumente und Kommunikation mit der Kundenorganisation.',
      tagSeverity: 'warn',
      items: ['Eigene Termine einsehen', 'Dokumente abrufen', 'Dokumente und Nachrichten vorbereiten'],
    },
  },
  { path: '**', redirectTo: '' },
];

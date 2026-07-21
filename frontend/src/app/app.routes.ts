import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Dashboard } from './pages/dashboard/dashboard';
import { RolePage } from './pages/role-page/role-page';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
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
    path: 'groomer',
    component: RolePage,
    canActivate: [roleGuard('ROLE_groomer')],
    data: {
      eyebrow: 'Groomer-Bereich',
      title: 'Groomer Arbeitsplatz',
      roleLabel: 'Groomer',
      description: 'Platzhalter für Tagesplan, Tierprofile, Kund:innen-Akten und Grooming-Dokumentation.',
      tagSeverity: 'info',
      items: ['Tagesplan und Termine sehen', 'Tierprofile und Kund:innen-Kontext öffnen', 'Grooming-Dokumentation pflegen'],
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

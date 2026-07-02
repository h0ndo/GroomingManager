import { JsonPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../core/auth.service';
import { runtimeConfig } from '../../core/runtime-config';

type MeResponse = {
  username: string;
  roles: string[];
};

@Component({
  selector: 'app-dashboard',
  imports: [ButtonModule, CardModule, JsonPipe, RouterLink, TagModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  protected readonly status = signal<unknown>(null);
  protected readonly me = signal<MeResponse | null>(null);
  protected readonly roleLabel = computed(() => this.resolveRoleLabel(this.me()?.roles ?? this.auth.roles(), this.preferredUsername()));
  protected readonly roleLinks = computed(() => [
    { label: 'Admin-Bereich', route: '/admin', icon: 'pi-shield', visible: this.auth.hasRole('ROLE_admin') },
    {
      label: 'Führungskraft-Bereich',
      route: '/fuehrungskraft',
      icon: 'pi-briefcase',
      visible: this.auth.hasRole('ROLE_fuehrungskraft'),
    },
    { label: 'Angestellte-Bereich', route: '/angestellter', icon: 'pi-calendar', visible: this.auth.hasRole('ROLE_angestellter') },
    { label: 'Kund:innen-Bereich', route: '/kunde', icon: 'pi-user', visible: this.auth.hasRole('ROLE_kunde') },
  ]);

  ngOnInit(): void {
    this.http.get(`${runtimeConfig.apiBaseUrl}/status`).subscribe((status) => this.status.set(status));
    if (this.auth.isAuthenticated()) {
      this.http.get<MeResponse>(`${runtimeConfig.apiBaseUrl}/me`).subscribe((me) => this.me.set(me));
    }
  }

  private preferredUsername(): string {
    const claims = this.auth.identityClaims();
    if (claims && 'preferred_username' in claims && typeof claims.preferred_username === 'string') {
      return claims.preferred_username;
    }

    if (claims && 'email' in claims && typeof claims.email === 'string') {
      return claims.email;
    }

    return this.me()?.username ?? '';
  }

  private resolveRoleLabel(roles: string[], username: string): string {
    if (roles.includes('ROLE_admin')) {
      return 'Admin';
    }

    if (roles.includes('ROLE_fuehrungskraft')) {
      return 'Führungskraft';
    }

    if (roles.includes('ROLE_angestellter')) {
      return 'Angestellte:r';
    }

    if (roles.includes('ROLE_kunde')) {
      return 'Kund:in';
    }


    if (username.startsWith('admin@')) {
      return 'Admin';
    }

    if (username.startsWith('fuehrungskraft@')) {
      return 'Führungskraft';
    }

    if (username.startsWith('angestellter@')) {
      return 'Angestellte:r';
    }

    if (username.startsWith('kunde@')) {
      return 'Kund:in';
    }

    return 'angemeldete:r Nutzer:in';
  }
}

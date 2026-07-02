import { Injectable, inject } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { runtimeConfig } from './runtime-config';

const authConfig: AuthConfig = {
  issuer: runtimeConfig.keycloakIssuerUrl,
  clientId: runtimeConfig.oidcClientId,
  responseType: 'code',
  scope: 'openid profile email',
  redirectUri: window.location.origin,
  postLogoutRedirectUri: window.location.origin,
  requireHttps: false,
  showDebugInformation: true,
  useSilentRefresh: true,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private loginStarted = false;

  async initialise(): Promise<void> {
    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();

    if (!this.isAuthenticated() && !this.loginStarted) {
      this.loginStarted = true;
      this.oauthService.initCodeFlow();
    }
  }

  login(): void {
    if (this.loginStarted) {
      return;
    }

    this.loginStarted = true;
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  accessToken(): string {
    return this.oauthService.getAccessToken();
  }

  roles(): string[] {
    const token = this.accessToken();
    if (!token) {
      return [];
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return [];
    }

    try {
      const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
        realm_access?: { roles?: string[] };
        resource_access?: Record<string, { roles?: string[] }>;
      };
      const realmRoles = payload.realm_access?.roles ?? [];
      const clientRoles = payload.resource_access?.[runtimeConfig.oidcClientId]?.roles ?? [];

      return [...new Set([...realmRoles, ...clientRoles].map((role) => `ROLE_${role}`))];
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role.startsWith('ROLE_') ? role : `ROLE_${role}`);
  }

  identityClaims(): object | null {
    return this.oauthService.getIdentityClaims() ?? null;
  }
}

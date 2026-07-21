import { Injectable, inject } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { runtimeConfig } from './runtime-config';

const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
const redirectUri = appOrigin === 'http://localhost:4200' ? 'http://localhost:4200' : appOrigin;

const authConfig: AuthConfig = {
  issuer: runtimeConfig.keycloakIssuerUrl,
  clientId: runtimeConfig.oidcClientId,
  responseType: 'code',
  scope: 'openid profile email',
  redirectUri,
  postLogoutRedirectUri: redirectUri,
  requireHttps: false,
  showDebugInformation: false,
  useSilentRefresh: true,
};

const keycloakAuthUrl = `${runtimeConfig.keycloakIssuerUrl}/protocol/openid-connect/auth`;
const keycloakRegistrationUrl = `${runtimeConfig.keycloakIssuerUrl}/protocol/openid-connect/registrations`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private loginStarted = false;

  async initialise(): Promise<void> {
    this.configure(authConfig);
    try {
      await this.oauthService.loadDiscoveryDocumentAndTryLogin();
    } catch {
      console.warn('Keycloak discovery is unavailable; public pages remain accessible.');
    }
  }

  login(): void {
    if (this.loginStarted) {
      return;
    }

    this.loginStarted = true;
    this.configure({
      ...authConfig,
      loginUrl: keycloakAuthUrl,
    });
    this.oauthService.initCodeFlow();
  }

  register(): void {
    if (this.loginStarted) {
      return;
    }

    this.loginStarted = true;
    this.configure({
      ...authConfig,
      loginUrl: keycloakRegistrationUrl,
    });
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

  private configure(config: AuthConfig): void {
    this.oauthService.configure(config);
    this.oauthService.setupAutomaticSilentRefresh();
  }
}

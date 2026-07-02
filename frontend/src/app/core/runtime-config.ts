export interface RuntimeConfig {
  apiBaseUrl: string;
  keycloakIssuerUrl: string;
  oidcClientId: string;
}

const appOrigin = window.location.origin;

export const runtimeConfig: RuntimeConfig = {
  apiBaseUrl: '/api',
  keycloakIssuerUrl: `${appOrigin}/auth/realms/grooming-manager`,
  oidcClientId: 'grooming-manager-app',
};

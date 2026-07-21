export interface RuntimeConfig {
  apiBaseUrl: string;
  keycloakIssuerUrl: string;
  oidcClientId: string;
}

export interface RuntimeLocationLike {
  protocol: string;
  hostname: string;
  port: string;
  origin: string;
}

const defaultLocation = typeof window !== 'undefined' ? window.location : undefined;

export function buildRuntimeConfig(location: RuntimeLocationLike = defaultLocation as RuntimeLocationLike): RuntimeConfig {
  const hostname = location?.hostname ?? 'localhost';
  const port = location?.port ?? '3000';
  const isLocalDevAngularHost = ['localhost', '127.0.0.1'].includes(hostname) && port === '4200';
  const isLocalProxyHost = ['localhost', '127.0.0.1'].includes(hostname) && port === '3000';

  const appOrigin = isLocalDevAngularHost || isLocalProxyHost ? 'http://localhost:3000' : location?.origin ?? 'http://localhost:3000';
  const issuerOrigin = isLocalDevAngularHost ? 'http://localhost:3000' : appOrigin;

  return {
    apiBaseUrl: '/api',
    keycloakIssuerUrl: `${issuerOrigin}/auth/realms/grooming-manager`,
    oidcClientId: 'grooming-manager-app',
  };
}

export const runtimeConfig: RuntimeConfig = buildRuntimeConfig();

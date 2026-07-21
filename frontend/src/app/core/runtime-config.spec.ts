import { buildRuntimeConfig } from './runtime-config';

describe('buildRuntimeConfig', () => {
  it('uses the local proxy URL for Keycloak when Angular runs on localhost:4200', () => {
    const config = buildRuntimeConfig({
      protocol: 'http:',
      hostname: 'localhost',
      port: '4200',
      origin: 'http://localhost:4200',
    } as Location);

    expect(config.keycloakIssuerUrl).toBe('http://localhost:3000/auth/realms/grooming-manager');
  });
});

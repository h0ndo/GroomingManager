import { TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';

import { AuthService } from './auth.service';

class OAuthServiceStub {
  configure = jasmine.createSpy('configure');
  setupAutomaticSilentRefresh = jasmine.createSpy('setupAutomaticSilentRefresh');
  loadDiscoveryDocumentAndTryLogin = jasmine
    .createSpy('loadDiscoveryDocumentAndTryLogin')
    .and.resolveTo(true);
  initCodeFlow = jasmine.createSpy('initCodeFlow');
  logOut = jasmine.createSpy('logOut');
  hasValidAccessToken = jasmine.createSpy('hasValidAccessToken').and.returnValue(false);
  getAccessToken = jasmine.createSpy('getAccessToken').and.returnValue('');
  getIdentityClaims = jasmine.createSpy('getIdentityClaims').and.returnValue(null);
}

describe('AuthService', () => {
  let service: AuthService;
  let oauth: OAuthServiceStub;

  beforeEach(() => {
    oauth = new OAuthServiceStub();
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: OAuthService, useValue: oauth }],
    });
    service = TestBed.inject(AuthService);
  });

  it('initialises OIDC without automatically redirecting anonymous visitors', async () => {
    await service.initialise();

    expect(oauth.configure).toHaveBeenCalledWith(
      jasmine.objectContaining({ showDebugInformation: false }),
    );
    expect(oauth.loadDiscoveryDocumentAndTryLogin).toHaveBeenCalled();
    expect(oauth.initCodeFlow).not.toHaveBeenCalled();
  });

  it('keeps the public page renderable when Keycloak discovery is temporarily unavailable', async () => {
    spyOn(console, 'warn');
    oauth.loadDiscoveryDocumentAndTryLogin.and.rejectWith(new Error('discovery unavailable'));

    await expectAsync(service.initialise()).toBeResolved();

    expect(console.warn).toHaveBeenCalledOnceWith(
      'Keycloak discovery is unavailable; public pages remain accessible.',
    );
    expect(oauth.initCodeFlow).not.toHaveBeenCalled();
  });

  it('starts the normal Keycloak login flow explicitly', () => {
    service.login();

    expect(oauth.configure).toHaveBeenCalledWith(
      jasmine.objectContaining({
        loginUrl: `${window.location.origin}/auth/realms/grooming-manager/protocol/openid-connect/auth`,
        showDebugInformation: false,
      }),
    );
    expect(oauth.initCodeFlow).toHaveBeenCalledOnceWith();
  });

  it('starts the Keycloak registration flow explicitly', () => {
    service.register();

    expect(oauth.configure).toHaveBeenCalledWith(
      jasmine.objectContaining({
        loginUrl: `${window.location.origin}/auth/realms/grooming-manager/protocol/openid-connect/registrations`,
        showDebugInformation: false,
      }),
    );
    expect(oauth.initCodeFlow).toHaveBeenCalledOnceWith();
  });
});

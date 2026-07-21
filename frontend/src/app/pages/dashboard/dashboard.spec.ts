import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { AuthService } from '../../core/auth.service';
import { runtimeConfig } from '../../core/runtime-config';
import { Dashboard } from './dashboard';

class AuthServiceStub {
  private authenticated = true;
  private roleList = ['ROLE_admin'];

  isAuthenticated = jasmine.createSpy('isAuthenticated').and.callFake(() => this.authenticated);
  identityClaims = jasmine.createSpy('identityClaims').and.returnValue({
    sub: '2ec0a9c1-71e2-48ff-a87b-c1b9d8f1594e',
    preferred_username: 'admin@grooming-manager.local',
    scope: 'openid profile email roles',
  });
  roles = jasmine.createSpy('roles').and.callFake(() => this.roleList);
  hasRole = jasmine
    .createSpy('hasRole')
    .and.callFake((role: string) => this.roleList.includes(role.startsWith('ROLE_') ? role : `ROLE_${role}`));
  login = jasmine.createSpy('login');
  logout = jasmine.createSpy('logout');

  setRoles(roles: string[]): void {
    this.roleList = roles;
  }
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function graphNodeButton(fixture: ComponentFixture<Dashboard>, label: string): HTMLButtonElement {
  const buttons = Array.from(fixture.nativeElement.querySelectorAll('.workspace-graph__node')) as HTMLButtonElement[];
  const button = buttons.find((candidate) => normalizeText(candidate.textContent) === label);

  if (!button) {
    throw new Error(`Graph node button "${label}" not found`);
  }

  return button;
}

function buttonByText(fixture: ComponentFixture<Dashboard>, label: string): HTMLButtonElement {
  const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
  const button = buttons.find((candidate) => candidate.textContent?.includes(label));

  if (!button) {
    throw new Error(`Button "${label}" not found`);
  }

  return button;
}

function activeGraphNodeButton(fixture: ComponentFixture<Dashboard>): HTMLButtonElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
    '.workspace-graph__node[aria-current="true"]',
  );
}

function closeActiveWorkPage(fixture: ComponentFixture<Dashboard>): void {
  buttonByText(fixture, 'Schließen').click();
  tick(230);
  fixture.detectChanges();
  tick(50);
  fixture.detectChanges();
}

function graphNodeLabels(fixture: ComponentFixture<Dashboard>): string[] {
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.workspace-graph__node')).map(
    (node) => normalizeText(node.textContent),
  );
}

function customerSearchResultButtons(fixture: ComponentFixture<Dashboard>): HTMLButtonElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.work-page-search__profile'),
  );
}

function favoriteToggleButtons(fixture: ComponentFixture<Dashboard>): HTMLButtonElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.favorite-toggle'),
  );
}


function customerDto(id: number, displayName: string, overrides: Record<string, string | null> = {}): Record<string, string | number | null> {
  return {
    id,
    keycloakSubject: null,
    displayName,
    email: `${displayName.toLocaleLowerCase('de-DE').replace(/\s+/g, '.')}@example.local`,
    phone: `+49 151 1000 ${String(id).padStart(4, '0')}`,
    communicationNotes: null,
    profileImageBase64: null,
    ...overrides,
  };
}

const testfamilieCustomers = [
  customerDto(10, 'Lena Testfamilie'),
  customerDto(11, 'Mara Testfamilie'),
  customerDto(12, 'Noah Testfamilie'),
  customerDto(13, 'Emil Testfamilie'),
  customerDto(14, 'Sofia Testfamilie'),
  customerDto(15, 'Nora Testfamilie'),
  customerDto(16, 'Oskar Testfamilie'),
  customerDto(17, 'Frieda Testfamilie'),
];

function setCustomerSearchTerm(fixture: ComponentFixture<Dashboard>, term: string): void {
  const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#workPageCustomerSearch');

  searchInput!.value = term;
  searchInput!.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let auth: AuthServiceStub;
  let httpTesting: HttpTestingController;

  function flushCustomerFavoritesIfRequested(): void {
    httpTesting.match(`${runtimeConfig.apiBaseUrl}/customer-favorites`).forEach((request) => request.flush([]));
  }


  function flushCustomerSearch(term: string, customers: Array<Record<string, string | number | null>>): void {
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${runtimeConfig.apiBaseUrl}/customers` &&
        candidate.params.get('query') === term &&
        candidate.params.get('limit') === '7',
    );
    expect(request.request.method).toBe('GET');
    request.flush(customers);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    auth = new AuthServiceStub();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting
      .match(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .forEach((request) => request.flush([]));
    httpTesting
      .match((request) => request.url === `${runtimeConfig.apiBaseUrl}/customers` && request.method === 'GET')
      .forEach((request) => request.flush([]));
    httpTesting.verify();
  });

  it('shows product-friendly backend and user summaries instead of raw diagnostics', () => {
    auth.setRoles(['ROLE_admin', 'ROLE_groomer']);

    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin', 'ROLE_groomer'],
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Backend verbunden');
    expect(text).toContain('Angemeldet als Admin');
    expect(text).not.toContain('Backend Status');
    expect(text).not.toContain('Angemeldeter Benutzer');
    expect(text).not.toContain('2ec0a9c1-71e2-48ff-a87b-c1b9d8f1594e');
    expect(text).not.toContain('openid profile email roles');
    expect((fixture.nativeElement as HTMLElement).querySelector('pre')).toBeNull();
  });

  it('opens the round customer search from the focused-work Kunden node and focuses the search field', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    const customersButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.workspace-graph__node[aria-label^="Kunden,"]',
    );

    expect(customersButton).not.toBeNull();

    customersButton!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }));
    customersButton!.click();
    fixture.detectChanges();
    tick();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#workPageCustomerSearch');

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(dialog?.textContent).toContain('Kundensuche');
    expect(searchInput).not.toBeNull();
    expect(document.activeElement).toBe(searchInput);
    expect(text).toContain('Der Kunden-Knoten öffnet für Admins und Groomer direkt die runde Suche');
    expect(graphNodeLabels(fixture)).toEqual(jasmine.arrayContaining(['Kunden', 'Suchen', 'Hinzufügen', 'Favoriten']));
  }));

  it('loads customer search results from the backend with one extra row for overflow detection', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Bitte gib einen Vor- oder Nachnamen ein.');
    httpTesting.expectNone(`${runtimeConfig.apiBaseUrl}/customers?query=&limit=7`);

    setCustomerSearchTerm(fixture, 'muster');
    tick();
    fixture.detectChanges();

    expect(dialog?.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(dialog?.textContent).toContain('Kundensuche wird geladen…');

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${runtimeConfig.apiBaseUrl}/customers` &&
        candidate.params.get('query') === 'muster' &&
        candidate.params.get('limit') === '7',
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 42,
        displayName: 'Mila Muster',
        email: 'mila.muster@example.local',
        phone: '+49 151 1000 1002',
        communicationNotes: 'Erstkontakt über Empfehlung',
        profileImageBase64: 'ZmFrZS1pbWFnZQ==',
      },
    ]);
    fixture.detectChanges();

    expect(customerSearchResultButtons(fixture)).toHaveSize(1);
    expect(dialog?.textContent).toContain('Mila Muster');
    expect(dialog?.textContent).toContain('Nicht angeheftet');
    expect(dialog?.querySelector('[aria-busy="true"]')).toBeNull();
  }));

  it('shows customer search load errors in the round work page and recovers on the next backend response', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    (fixture.componentInstance as unknown as { updateCustomerSearchTerm: (searchTerm: string) => void }).updateCustomerSearchTerm(
      'muster',
    );
    httpTesting
      .expectOne(
        (candidate) =>
          candidate.url === `${runtimeConfig.apiBaseUrl}/customers` &&
          candidate.params.get('query') === 'muster' &&
          candidate.params.get('limit') === '7',
      )
      .flush({ detail: 'Database unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain('Kunden konnten nicht geladen werden. Bitte versuche es erneut.');
    expect(dialog?.querySelector('[role="alert"]')).not.toBeNull();

    (fixture.componentInstance as unknown as { updateCustomerSearchTerm: (searchTerm: string) => void }).updateCustomerSearchTerm(
      'katja',
    );
    flushCustomerSearch('katja', [customerDto(7, 'Katja Gross')]);

    expect(dialog?.textContent).toContain('Katja Gross');
    expect(dialog?.textContent).not.toContain('Kunden konnten nicht geladen werden. Bitte versuche es erneut.');
    expect(dialog?.querySelector('[role="alert"]')).toBeNull();
  }));

  it('opens a selected customer search result as a read-only profile with a route back to search', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    setCustomerSearchTerm(fixture, 'muster');
    flushCustomerSearch('muster', [
      customerDto(8, 'Mila Muster', {
        email: 'mila.muster@example.local',
        phone: '+49 151 1000 1002',
        communicationNotes: 'Erstkontakt über Empfehlung',
      }),
    ]);

    const searchDialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(searchDialog?.textContent).toContain('Mila Muster');
    expect(searchDialog?.textContent).not.toContain('Katja Gross');

    buttonByText(fixture, 'Mila Muster').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const profile = host.querySelector<HTMLElement>('#customerProfileReadMode');

    expect(dialog?.textContent).toContain('Mila Muster Profil');
    expect(dialog?.textContent).toContain('Lesemodus · keine direkte Bearbeitung');
    expect(dialog?.textContent).toContain('Vorname');
    expect(dialog?.textContent).toContain('Mila');
    expect(dialog?.textContent).toContain('Nachname');
    expect(dialog?.textContent).toContain('Muster');
    expect(dialog?.textContent).toContain('mila.muster@example.local');
    expect(dialog?.textContent).toContain('+49 151 1000 1002');
    expect(dialog?.textContent).toContain('Zurück zur Suche');
    expect(dialog?.textContent).toContain('Nicht angeheftet');
    expect(dialog?.textContent).toContain('Als Favorit anheften');
    expect(dialog?.textContent).not.toContain('Speichern');
    expect(profile?.getAttribute('aria-label')).toBe('Mila Muster Kundenprofil im Lesemodus');
    expect(document.activeElement).toBe(profile);

    buttonByText(fixture, 'Zurück zur Suche').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(host.querySelector<HTMLInputElement>('#workPageCustomerSearch')?.value).toBe('muster');
    expect(document.activeElement).toBe(host.querySelector<HTMLInputElement>('#workPageCustomerSearch'));
    expect(host.textContent).toContain('Mila Muster');
  }));

  it('opens a customer search result with Enter using the button screenreader name', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    setCustomerSearchTerm(fixture, 'katja');
    flushCustomerSearch('katja', [
      customerDto(7, 'Katja Gross', { email: 'katja.gross@example.local' }),
    ]);

    const result = customerSearchResultButtons(fixture)[0];
    expect(result.getAttribute('aria-label')).toBe('Katja Gross, Kund:in, Kundenprofil im Lesemodus öffnen');

    result.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Katja Gross Profil');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('katja.gross@example.local');
    expect(document.activeElement).toBe((fixture.nativeElement as HTMLElement).querySelector('#customerProfileReadMode'));
  }));

  it('shows at most six round customer search result nodes and asks to refine larger result sets', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain('Bitte gib einen Vor- oder Nachnamen ein.');
    expect(customerSearchResultButtons(fixture)).toHaveSize(0);

    setCustomerSearchTerm(fixture, 'testfamilie');
    flushCustomerSearch('testfamilie', testfamilieCustomers);

    const resultButtons = customerSearchResultButtons(fixture);

    expect(resultButtons).toHaveSize(6);
    expect(
      resultButtons.every((button) => button.closest('.work-page-search__item--avatar-node') !== null),
    ).toBeTrue();
    expect(resultButtons[0].textContent).toContain('Lena Testfamilie');
    expect(resultButtons[5].textContent).toContain('Nora Testfamilie');
    expect(dialog?.textContent).toContain('8 Kunden gefunden. Bitte Suche verfeinern');
    expect(dialog?.textContent).not.toContain('Oskar Testfamilie');

    setCustomerSearchTerm(fixture, 'lena');
    flushCustomerSearch('lena', [customerDto(10, 'Lena Testfamilie')]);

    expect(customerSearchResultButtons(fixture)).toHaveSize(1);
    expect(dialog?.textContent).not.toContain('Bitte Suche verfeinern');

    setCustomerSearchTerm(fixture, 'unbekannt');
    flushCustomerSearch('unbekannt', []);

    expect(customerSearchResultButtons(fixture)).toHaveSize(0);
    expect(dialog?.textContent).toContain('Keine Kund:innen für diese Suche gefunden.');
  }));

  it('opens the reusable circular work page from the customer add node and closes it with cancel', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    closeActiveWorkPage(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain('Kunden hinzufügen');
    expect(dialog?.textContent).toContain('Name des Kunden');
    expect(dialog?.textContent).toContain('Speichern');
    expect(dialog?.textContent).toContain('Abbrechen');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-workspace-graph')?.getAttribute('inert')).toBe('');

    buttonByText(fixture, 'Abbrechen').click();
    tick(230);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-workspace-graph')?.hasAttribute('inert')).toBeFalse();
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hinzufügen');
    expect(document.activeElement).toBe(activeGraphNodeButton(fixture));
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Mila Muster angeheftet');
  }));

  it('creates a customer through the circular work page primary action using the customers API response id', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    closeActiveWorkPage(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const nameInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#workPageCustomerName');
    nameInput!.value = 'Mila Muster';
    nameInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonByText(fixture, 'Speichern').click();

    const createRequest = httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({ displayName: 'Mila Muster' });
    createRequest.flush({
      id: 42,
      keycloakSubject: null,
      displayName: 'Mila Muster',
      email: 'mila@example.local',
      phone: '+49 151 2000 0000',
      communicationNotes: 'Bevorzugt Freitags',
      profileImageBase64: null,
    });
    tick(230);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Mila Muster angeheftet');
    expect(text).toContain('Mila Muster');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Mila Muster');
    expect(activeGraphNodeButton(fixture)?.getAttribute('data-node-id')).toBe('42');
    expect(document.activeElement).toBe(activeGraphNodeButton(fixture));
  }));

  it('keeps the customer create work page busy and prevents duplicate posts while saving', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    closeActiveWorkPage(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const nameInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#workPageCustomerName');
    nameInput!.value = 'Mila Muster';
    nameInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonByText(fixture, 'Speichern').click();
    fixture.detectChanges();

    const createRequest = httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers`);
    expect(buttonByText(fixture, 'Speichern').disabled).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('[aria-busy="true"]')).not.toBeNull();

    buttonByText(fixture, 'Speichern').click();
    httpTesting.expectNone(`${runtimeConfig.apiBaseUrl}/customers`);

    createRequest.flush({
      id: 43,
      keycloakSubject: null,
      displayName: 'Mila Muster',
      email: null,
      phone: null,
      communicationNotes: null,
      profileImageBase64: null,
    });
    tick(230);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Mila Muster');
  }));

  it('shows a friendly customer create error and does not create a local customer node', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    closeActiveWorkPage(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const nameInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#workPageCustomerName');
    nameInput!.value = 'Mila Muster';
    nameInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonByText(fixture, 'Speichern').click();
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers`).flush(
      { detail: 'Validation failed' },
      { status: 400, statusText: 'Bad Request' },
    );
    tick(230);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    expect(host.textContent).toContain('Kunde konnte nicht gespeichert werden. Bitte versuche es erneut.');
    expect(graphNodeLabels(fixture)).not.toContain('Mila Muster');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hinzufügen');
    expect(buttonByText(fixture, 'Speichern').disabled).toBeFalse();

    buttonByText(fixture, 'Speichern').click();
    expect(httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers`).request.method).toBe('POST');
  }));

  it('opens customer favorites with real loaded customers instead of a static empty-state stub', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([
      { customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null },
      { customerId: 9, firstName: 'Alex', lastName: 'Sommer', profileImageBase64: null },
    ]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    closeActiveWorkPage(fixture);
    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const region = dialog?.querySelector('[role="region"]');

    expect(dialog?.textContent).toContain('Kundenfavoriten');
    expect(dialog?.textContent).toContain('Bis zu sechs favorisierte Kund:innen sind als Instanzknoten direkt am Favoriten-Knoten sichtbar.');
    expect(dialog?.textContent).toContain('Katja Gross');
    expect(dialog?.textContent).toContain('Alex Sommer');
    expect(dialog?.textContent).not.toContain('Noch keine Kund:innen vorhanden. Kund:in hinzufügen.');
    expect(region?.getAttribute('aria-label')).toBe('Kundenfavoriten, scrollbarer Inhalt');
    expect(graphNodeLabels(fixture)).toEqual(jasmine.arrayContaining(['Favoriten', 'Katja Gross', 'Alex Sommer']));
    expect(graphNodeButton(fixture, 'Katja Gross').querySelectorAll('.workspace-graph__label-line')).toHaveSize(2);
    expect(graphNodeButton(fixture, 'Katja Gross').getAttribute('aria-label')).toContain('Katja Gross, Kunden-Instanz');
    expect(dialog?.textContent).toContain('Schließen');
    expect(dialog?.textContent).not.toContain('Speichern');
  }));

  it('opens a personal favorite customer node directly as a read-only profile', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([
      { customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null },
    ]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    closeActiveWorkPage(fixture);
    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    closeActiveWorkPage(fixture);

    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const profile = host.querySelector<HTMLElement>('#customerProfileReadMode');

    expect(dialog?.textContent).toContain('Katja Gross Profil');
    expect(dialog?.textContent).toContain('Lesemodus · keine direkte Bearbeitung');
    expect(dialog?.textContent).toContain('Zum Favoriten-Knoten');
    expect((host.textContent ?? '')).toContain('Der Favoriten-Kundenknoten öffnet das Kundenprofil direkt im Lesemodus.');
    expect(profile?.getAttribute('aria-label')).toBe('Katja Gross Kundenprofil im Lesemodus');
    expect(document.activeElement).toBe(profile);
  }));

  it('opens a day planning calendar renderer stub from the calendar graph node', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kalender').click();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Tagesplanung').click();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const region = dialog?.querySelector('[role="region"]');

    expect(dialog?.textContent).toContain('Tagesplanung');
    expect(dialog?.textContent).toContain('Heute · Tagesplanung');
    expect(dialog?.textContent).toContain('09:00');
    expect(dialog?.textContent).toContain('Für diesen Tag sind keine Termine geplant.');
    expect(region?.getAttribute('aria-label')).toBe('Tagesplanung, scrollbarer Inhalt');
    expect(host.querySelector('[aria-label="Vorheriger Tag"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Nächster Tag"]')).not.toBeNull();
  });

  it('pins and removes a customer from search through the personal favorites API', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    setCustomerSearchTerm(fixture, 'katja');
    flushCustomerSearch('katja', [
      customerDto(7, 'Katja Gross', { email: 'katja.gross@example.local' }),
    ]);

    expect(favoriteToggleButtons(fixture)[0].textContent).toContain('Als Favorit anheften');
    favoriteToggleButtons(fixture)[0].click();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites/7`).flush({
      customerId: 7,
      firstName: 'Katja',
      lastName: 'Gross',
      profileImageBase64: null,
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Katja Gross ist jetzt dein persönlicher Favorit.');
    expect(graphNodeLabels(fixture)).toContain('Katja Gross');
    expect(favoriteToggleButtons(fixture)[0].textContent).toContain('Aus Favoriten entfernen');

    favoriteToggleButtons(fixture)[0].click();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites/7`).flush(null);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Katja Gross wurde aus deinen persönlichen Favoriten entfernt.');
    expect(favoriteToggleButtons(fixture)[0].textContent).toContain('Als Favorit anheften');
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
  }));

  it('shows a friendly limit message when the favorites API rejects a seventh favorite', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([
      { customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null },
      { customerId: 9, firstName: 'Alex', lastName: 'Sommer', profileImageBase64: null },
      { customerId: 10, firstName: 'Lena', lastName: 'Testfamilie', profileImageBase64: null },
      { customerId: 11, firstName: 'Mara', lastName: 'Testfamilie', profileImageBase64: null },
      { customerId: 12, firstName: 'Noah', lastName: 'Testfamilie', profileImageBase64: null },
      { customerId: 13, firstName: 'Emil', lastName: 'Testfamilie', profileImageBase64: null },
    ]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    setCustomerSearchTerm(fixture, 'muster');
    flushCustomerSearch('muster', [customerDto(8, 'Mila Muster')]);

    favoriteToggleButtons(fixture)[0].click();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites/8`).flush(
      { detail: 'Maximal 6 Kundenfavoriten erlaubt.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Du hast bereits 6 persönliche Favoriten. Entferne erst einen Favoriten, bevor du einen neuen anheftest.',
    );
    expect(graphNodeLabels(fixture)).not.toContain('Mila Muster');
  }));

  it('hides groomer/admin customer search and favorites for the customer role', () => {
    auth.setRoles(['ROLE_kunde']);

    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'kunde@grooming-manager.local',
      roles: ['ROLE_kunde'],
    });
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toContain('Mein Profil');
    expect(graphNodeLabels(fixture)).not.toContain('Suchen');
    expect(graphNodeLabels(fixture)).not.toContain('Favoriten');
  });

  it('normalizes a fully expanded custom-flex graph when switching back to focused work', () => {
    fixture.detectChanges();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/status`).flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([
      { customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null },
      { customerId: 9, firstName: 'Alex', lastName: 'Sommer', profileImageBase64: null },
    ]);
    fixture.detectChanges();

    buttonByText(fixture, 'Custom Flex').click();
    fixture.detectChanges();
    buttonByText(fixture, 'Alles aufklappen').click();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture).length).toBe(25);
    expect(graphNodeLabels(fixture)).toContain('Groomer hinzufügen');

    buttonByText(fixture, 'Focused Work').click();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toEqual(['Start', 'Groomer', 'Kalender', 'Admin', 'Kunden', 'Hunde']);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Groomer hinzufügen');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Start');
  });
});

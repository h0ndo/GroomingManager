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
    .and.callFake((role: string) =>
      this.roleList.includes(role.startsWith('ROLE_') ? role : `ROLE_${role}`),
    );
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
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll('.workspace-shell .workspace-graph__node'),
  ) as HTMLButtonElement[];
  const button = buttons.find((candidate) => normalizeText(candidate.textContent) === label);

  if (!button) {
    throw new Error(`Graph node button "${label}" not found`);
  }

  return button;
}

function sandboxGraphNodeButton(fixture: ComponentFixture<Dashboard>, label: string): HTMLButtonElement {
  const buttons = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.graph-sandbox .workspace-graph__node',
    ),
  ) as HTMLButtonElement[];
  const button = buttons.find((candidate) => normalizeText(candidate.textContent) === label);

  if (!button) {
    throw new Error(`Sandbox graph node button "${label}" not found`);
  }

  return button;
}

function graphNodePosition(fixture: ComponentFixture<Dashboard>, nodeId: string): { x: number; y: number } {
  const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
    `.workspace-shell [data-node-id="${nodeId}"]`,
  );

  if (!button) {
    throw new Error(`Graph node with id "${nodeId}" not found`);
  }

  return {
    x: Number.parseFloat(button.style.left),
    y: Number.parseFloat(button.style.top),
  };
}

function buttonByText(fixture: ComponentFixture<Dashboard>, label: string): HTMLButtonElement {
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll('button'),
  ) as HTMLButtonElement[];
  const button = buttons.find((candidate) => candidate.textContent?.includes(label));

  if (!button) {
    throw new Error(`Button "${label}" not found`);
  }

  return button;
}

function activeGraphNodeButton(fixture: ComponentFixture<Dashboard>): HTMLButtonElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
    '.workspace-shell .workspace-graph__node[aria-current="true"]',
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
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('.workspace-shell .workspace-graph__node'),
  ).map((node) => normalizeText(node.textContent));
}

function customerSearchResultButtons(fixture: ComponentFixture<Dashboard>): HTMLButtonElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.work-page-search__profile',
    ),
  );
}

function dogDto(
  id: number,
  name: string,
  customerId: number,
  customerDisplayName: string,
  overrides: Record<string, string | number | null> = {},
): Record<string, string | number | null> {
  return {
    id,
    ownerSubject: `customer:${customerId}`,
    name,
    breed: 'Pudel',
    size: 'mittel',
    groomingNotes: null,
    imageBase64: null,
    customerId,
    customerDisplayName,
    ...overrides,
  };
}

function favoriteToggleButtons(fixture: ComponentFixture<Dashboard>): HTMLButtonElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.favorite-toggle'),
  );
}

function customerListTableRows(fixture: ComponentFixture<Dashboard>): HTMLTableRowElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLTableRowElement>(
      '.customer-list-table tbody tr',
    ),
  );
}

function expandCustomersNode(fixture: ComponentFixture<Dashboard>): void {
  graphNodeButton(fixture, 'Kunden').click();
  fixture.detectChanges();
  tick();
  fixture.detectChanges();
}

function openCustomerSearchFromGraph(fixture: ComponentFixture<Dashboard>): void {
  if (!graphNodeLabels(fixture).includes('Suchen')) {
    expandCustomersNode(fixture);
  }

  graphNodeButton(fixture, 'Suchen').click();
  fixture.detectChanges();
  tick();
  fixture.detectChanges();
}

function customerDto(
  id: number,
  displayName: string,
  overrides: Record<string, string | null> = {},
): Record<string, string | number | null> {
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

const paginatedCustomerList = Array.from({ length: 31 }, (_, index) => {
  const id = index + 1;

  return customerDto(id, `Vorname${String(id).padStart(2, '0')} Nachname${String(id).padStart(2, '0')}`);
});

function setCustomerSearchTerm(fixture: ComponentFixture<Dashboard>, term: string): void {
  const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
    '#workPageCustomerSearch',
  );

  searchInput!.value = term;
  searchInput!.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let auth: AuthServiceStub;
  let httpTesting: HttpTestingController;

  function flushCustomerFavoritesIfRequested(): void {
    httpTesting
      .match(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .forEach((request) => request.flush([]));
  }

  function flushCustomerSearch(
    term: string,
    customers: Array<Record<string, string | number | null>>,
  ): void {
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

  function flushCustomerList(customers: Array<Record<string, string | number | null>>): void {
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${runtimeConfig.apiBaseUrl}/customers` &&
        candidate.params.get('limit') === '100' &&
        !candidate.params.has('query'),
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
      .match(
        (request) =>
          request.url === `${runtimeConfig.apiBaseUrl}/customers` && request.method === 'GET',
      )
      .forEach((request) => request.flush([]));
    httpTesting
      .match((request) => request.url === `${runtimeConfig.apiBaseUrl}/dogs` && request.method === 'GET')
      .forEach((request) => request.flush([]));
    httpTesting.verify();
  });

  it('shows product-friendly backend and user summaries instead of raw diagnostics', () => {
    auth.setRoles(['ROLE_admin', 'ROLE_groomer']);

    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
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

  it('renders an isolated graph component sandbox with static test data below the business graph', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    const sandbox = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.graph-sandbox');

    expect(sandbox).not.toBeNull();
    expect(sandbox?.textContent).toContain('Arbeitsgraph ohne Fachlogik');
    expect(sandbox?.textContent).toContain('Root → Domain');
    expect(sandbox?.textContent).toContain('190 px');
    expect(sandbox?.textContent).not.toContain('Kundenliste');
    expect(sandboxGraphNodeButton(fixture, 'Graph-Labor')).not.toBeNull();
    expect(sandboxGraphNodeButton(fixture, 'Domäne A')).not.toBeNull();
    expect(sandbox?.textContent).not.toContain('Seite A');

    sandboxGraphNodeButton(fixture, 'Domäne A').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(sandboxGraphNodeButton(fixture, 'Seite A')).not.toBeNull();
    expect(sandboxGraphNodeButton(fixture, 'Aktion A')).not.toBeNull();
    expect(sandboxGraphNodeButton(fixture, 'Objekt A')).not.toBeNull();
    expect(sandbox?.textContent).toContain('Domäne A · Typ domain');

    sandboxGraphNodeButton(fixture, 'Objekt A').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(sandboxGraphNodeButton(fixture, 'Prüfen')).not.toBeNull();
    expect(sandbox?.textContent).toContain('Objekt A · Typ instance');
  }));

  it('toggles the focused-work Kunden structure node without opening a work page', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    const customersButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.workspace-graph__node[aria-label^="Kunden,"]',
    );

    expect(customersButton).not.toBeNull();
    expect(customersButton!.getAttribute('aria-expanded')).toBe('false');

    customersButton!.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }),
    );
    customersButton!.click();
    fixture.detectChanges();
    tick();

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeButton(fixture, 'Kunden').getAttribute('aria-expanded')).toBe('true');
    expect(graphNodeButton(fixture, 'Kunden').getAttribute('aria-label')).toContain('aufgeklappt');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Kunden ist aufgeklappt');
    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Kunden', 'Suchen', 'Hinzufügen', 'Favoriten']),
    );

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeButton(fixture, 'Kunden').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeLabels(fixture)).not.toContain('Suchen');
  }));

  it('activates Hunde as focused-work focus with pointer and keyboard without panning', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      focusedTopLevelNodeId: () => string | undefined;
      presentedCenteredNodeId: () => string;
    };
    const dogsButton = graphNodeButton(fixture, 'Hunde');

    dogsButton.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }),
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.workspace-graph__viewport--panning')).toBeNull();

    dogsButton.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hunde');
    expect(component.focusedTopLevelNodeId()).toBe('dogs');
    expect(component.presentedCenteredNodeId()).toBe('dogs');
    expect(graphNodeButton(fixture, 'Hunde').getAttribute('aria-current')).toBe('true');
    expect(graphNodeButton(fixture, 'Hunde').getAttribute('aria-label')).toContain(
      'Hunde, Domäne. Aktiver Arbeitsknoten',
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Hund suchen');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Hundeliste');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Hund hinzufügen');

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');

    graphNodeButton(fixture, 'Hunde').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hunde');
    expect(component.focusedTopLevelNodeId()).toBe('dogs');

    graphNodeButton(fixture, 'Kalender').dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kalender');
    expect(component.focusedTopLevelNodeId()).toBe('calendar');
  }));

  it('closes open Kunden descendants when Hunde is activated as a top-level work node', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    expandCustomersNode(fixture);

    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Kunden', 'Suchen', 'Hinzufügen', 'Hunde']),
    );
    expect(graphNodeButton(fixture, 'Kunden').getAttribute('aria-expanded')).toBe('true');

    graphNodeButton(fixture, 'Hunde').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      expandedNodeIds: () => ReadonlySet<string>;
      focusedTopLevelNodeId: () => string | undefined;
    };

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hunde');
    expect(component.focusedTopLevelNodeId()).toBe('dogs');
    expect(component.expandedNodeIds().has('customers')).toBeFalse();
    expect(graphNodeButton(fixture, 'Kunden').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeLabels(fixture)).not.toContain('Suchen');
    expect(graphNodeLabels(fixture)).not.toContain('Hinzufügen');
  }));

  it('closes stale top-level subtrees recursively when switching back to Kunden', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([{ customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null }]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Favoriten', 'Katja Gross', 'Profil']),
    );

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      expandedNodeIds: () => ReadonlySet<string>;
      focusedTopLevelNodeId: () => string | undefined;
    };

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(component.focusedTopLevelNodeId()).toBe('customers');
    expect(component.expandedNodeIds().has('customers')).toBeTrue();
    expect(component.expandedNodeIds().has('customer-favorites')).toBeFalse();
    expect(component.expandedNodeIds().has('7')).toBeFalse();
    expect(graphNodeLabels(fixture)).toEqual(jasmine.arrayContaining(['Suchen', 'Hinzufügen']));
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-node-id="7-profile"]')).toBeNull();
  }));

  it('focuses every visible top-level work node in focused-work mode instead of special-casing Kunden', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      focusedTopLevelNodeId: () => string | undefined;
    };
    const topLevelNodes = [
      { label: 'Groomer', id: 'groomers' },
      { label: 'Kalender', id: 'calendar' },
      { label: 'Admin', id: 'admin' },
      { label: 'Kunden', id: 'customers' },
      { label: 'Favoriten', id: 'customer-favorites' },
      { label: 'Hunde', id: 'dogs' },
    ];

    topLevelNodes.forEach((node) => {
      graphNodeButton(fixture, node.label).click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe(node.label);
      expect(component.focusedTopLevelNodeId()).toBe(node.id);
    });
  }));

  it('opens the round customer search from the functional search node and focuses the search field', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    expandCustomersNode(fixture);
    graphNodeButton(fixture, 'Suchen').click();
    fixture.detectChanges();
    tick();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    const searchInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#workPageCustomerSearch',
    );

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Suchen').getAttribute('aria-current')).toBeNull();
    expect(graphNodeButton(fixture, 'Suchen').getAttribute('aria-label')).not.toContain(
      'Aktiver Arbeitsknoten',
    );
    expect(dialog?.textContent).toContain('Kundensuche');
    expect(searchInput).not.toBeNull();
    expect(document.activeElement).toBe(searchInput);
  }));

  it('opens the customer list action as a round PrimeNG table with 30-row pagination', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    expandCustomersNode(fixture);

    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Kunden', 'Kundenliste']),
    );

    graphNodeButton(fixture, 'Kundenliste').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    flushCustomerList(paginatedCustomerList);

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const circularWorkPage = host.querySelector('app-circular-work-page');
    const tableHost = host.querySelector('p-table.customer-list-table');
    const table = host.querySelector('.customer-list-table--compact');
    const headers = Array.from(
      host.querySelectorAll<HTMLTableCellElement>('.customer-list-table thead th'),
    ).map((header) => normalizeText(header.textContent));

    expect(circularWorkPage).not.toBeNull();
    expect(dialog?.textContent).toContain('Kundenliste');
    expect(dialog?.classList).toContain('circular-work-page__dialog--list');
    expect(tableHost).not.toBeNull();
    expect(table).not.toBeNull();
    expect(tableHost?.getAttribute('size')).toBe('small');
    expect(headers).toEqual(['Vorname', 'Nachname', 'E-Mail', 'Telefonnummer']);
    expect(customerListTableRows(fixture)).toHaveSize(30);
    const firstDataCell = customerListTableRows(fixture)[0].querySelector<HTMLTableCellElement>('td');
    const firstDataCellStyle = getComputedStyle(firstDataCell!);

    expect(firstDataCellStyle.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(firstDataCellStyle.color).toBe('rgb(0, 0, 0)');
    expect(parseFloat(firstDataCellStyle.fontSize)).toBeLessThanOrEqual(12);
    expect(parseFloat(firstDataCellStyle.paddingTop)).toBeLessThanOrEqual(2);
    expect(firstDataCellStyle.borderLeftWidth).toBe('0px');
    expect(firstDataCellStyle.borderRightWidth).toBe('0px');
    expect(dialog?.textContent).toContain('Vorname01');
    expect(dialog?.textContent).not.toContain('Vorname31');
    expect(dialog?.querySelector('.p-paginator')).not.toBeNull();
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Kundenliste').getAttribute('aria-current')).toBeNull();

    const secondPageButton = Array.from(
      dialog!.querySelectorAll<HTMLButtonElement>('.p-paginator button'),
    ).find((button) => normalizeText(button.textContent) === '2');

    expect(secondPageButton).not.toBeUndefined();
    secondPageButton!.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(customerListTableRows(fixture)).toHaveSize(1);
    expect(dialog?.textContent).toContain('Vorname31');
    expect(dialog?.textContent).not.toContain('Vorname01');
  }));

  it('opens the customer list action with Enter and Space without changing the focused-work node', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    expandCustomersNode(fixture);

    graphNodeButton(fixture, 'Kundenliste').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    flushCustomerList([customerDto(1, 'Katja Gross')]);

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')?.textContent).toContain(
      'Kundenliste',
    );
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Kundenliste').getAttribute('aria-current')).toBeNull();

    closeActiveWorkPage(fixture);

    graphNodeButton(fixture, 'Kundenliste').dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    flushCustomerList([]);

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain('Kundenliste');
    expect(dialog?.textContent).toContain('Noch keine Kund:innen vorhanden.');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Kundenliste').getAttribute('aria-current')).toBeNull();
  }));

  it('opens action nodes with keyboard without making them the focused-work focus', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    expandCustomersNode(fixture);
    graphNodeButton(fixture, 'Suchen').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')?.textContent).toContain(
      'Kundensuche',
    );
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Suchen').getAttribute('aria-current')).toBeNull();

    closeActiveWorkPage(fixture);

    graphNodeButton(fixture, 'Hinzufügen').dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')?.textContent).toContain(
      'Kunden hinzufügen',
    );
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Hinzufügen').getAttribute('aria-current')).toBeNull();
  }));

  it('loads customer search results from the backend with one extra row for overflow detection', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);

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
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);

    (
      fixture.componentInstance as unknown as {
        updateCustomerSearchTerm: (searchTerm: string) => void;
      }
    ).updateCustomerSearchTerm('muster');
    httpTesting
      .expectOne(
        (candidate) =>
          candidate.url === `${runtimeConfig.apiBaseUrl}/customers` &&
          candidate.params.get('query') === 'muster' &&
          candidate.params.get('limit') === '7',
      )
      .flush(
        { detail: 'Database unavailable' },
        { status: 503, statusText: 'Service Unavailable' },
      );
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain(
      'Kunden konnten nicht geladen werden. Bitte versuche es erneut.',
    );
    expect(dialog?.querySelector('[role="alert"]')).not.toBeNull();

    (
      fixture.componentInstance as unknown as {
        updateCustomerSearchTerm: (searchTerm: string) => void;
      }
    ).updateCustomerSearchTerm('katja');
    flushCustomerSearch('katja', [customerDto(7, 'Katja Gross')]);

    expect(dialog?.textContent).toContain('Katja Gross');
    expect(dialog?.textContent).not.toContain(
      'Kunden konnten nicht geladen werden. Bitte versuche es erneut.',
    );
    expect(dialog?.querySelector('[role="alert"]')).toBeNull();
  }));


  it('opens dog search from the Hunde node with limited results and visible customer context', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Hunde').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Hunde', 'Hund suchen', 'Hundeliste']),
    );

    graphNodeButton(fixture, 'Hund suchen').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const graphHost = host.querySelector('gmf-workspace-graph');

    expect(dialog?.textContent).toContain('Hundesuche');
    expect(host.querySelector<HTMLInputElement>('#workPageDogSearch')).not.toBeNull();
    expect(graphHost?.getAttribute('inert')).toBe('');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hunde');
    expect(graphNodeButton(fixture, 'Hund suchen').getAttribute('aria-current')).toBeNull();

    const searchInput = host.querySelector<HTMLInputElement>('#workPageDogSearch')!;
    searchInput.value = 'testhund';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${runtimeConfig.apiBaseUrl}/dogs` &&
        !candidate.params.has('query') &&
        candidate.params.get('limit') === '100',
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      dogDto(1, 'Testhund A', 7, 'Katja Gross'),
      dogDto(2, 'Testhund B', 8, 'Mila Muster'),
      dogDto(3, 'Testhund C', 9, 'Alex Sommer'),
      dogDto(4, 'Testhund D', 10, 'Lena Klein'),
      dogDto(5, 'Testhund E', 11, 'Nora Kurz'),
      dogDto(6, 'Testhund F', 12, 'Mara Lang'),
      dogDto(7, 'Testhund G', 13, 'Noah Stark'),
      dogDto(8, 'Nicht passend', 14, 'Filter Kunde'),
    ]);
    fixture.detectChanges();

    const resultButtons = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.work-page-search__profile'),
    );

    expect(resultButtons).toHaveSize(6);
    expect(dialog?.textContent).toContain('Testhund A');
    expect(dialog?.textContent).toContain('Katja Gross');
    expect(dialog?.textContent).toContain('7 Hunde gefunden. Bitte Suche verfeinern');
    expect(dialog?.textContent).not.toContain('Testhund G');
    expect(resultButtons[0].getAttribute('aria-label')).toBe(
      'Testhund A, gehört zu Katja Gross, Hund-Kontext öffnen',
    );
  }));

  it('opens dog list entries as concrete dog contexts without focusing the action node', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Hunde').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Hundeliste').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${runtimeConfig.apiBaseUrl}/dogs` &&
        candidate.params.get('limit') === '100',
    );
    expect(request.request.method).toBe('GET');
    request.flush([dogDto(12, 'Nala', 8, 'Mila Muster', { breed: 'Labradoodle' })]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const dogEntry = host.querySelector<HTMLButtonElement>('.dog-list-work-page__item')!;

    expect(dialog?.textContent).toContain('Hundeliste');
    expect(dialog?.textContent).toContain('Nala');
    expect(dialog?.textContent).toContain('Mila Muster');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hunde');
    expect(graphNodeButton(fixture, 'Hundeliste').getAttribute('aria-current')).toBeNull();

    dogEntry.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    tick(260);
    fixture.detectChanges();

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Nala Mila Muster', 'Details', 'Termin']),
    );
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Nala Mila Muster');
    expect(host.textContent).toContain('Nala gehört zu Mila Muster');

    const dogsPosition = graphNodePosition(fixture, 'dogs');
    const dogSearchPosition = graphNodePosition(fixture, 'dog-search');
    const dogListPosition = graphNodePosition(fixture, 'dog-list');
    const dogAddPosition = graphNodePosition(fixture, 'dog-add');
    const concreteDogPosition = graphNodePosition(fixture, 'dog:12');
    const distanceFromDogs = (position: { x: number; y: number }) =>
      Math.hypot(position.x - dogsPosition.x, position.y - dogsPosition.y);

    expect(dogSearchPosition.y).toBeGreaterThan(120);
    expect(dogListPosition.y).toBeGreaterThan(120);
    expect(distanceFromDogs(dogAddPosition)).toBeCloseTo(distanceFromDogs(dogSearchPosition), 0);
    expect(distanceFromDogs(dogListPosition)).toBeCloseTo(distanceFromDogs(dogSearchPosition), 0);
    expect(distanceFromDogs(concreteDogPosition)).toBeGreaterThan(distanceFromDogs(dogSearchPosition));
  }));

  it('opens one dog creation flow from the Hunde action with required customer selection', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Hunde').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toContain('Hund hinzufügen');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Hunde');

    graphNodeButton(fixture, 'Hund hinzufügen').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const saveButton = buttonByText(fixture, 'Hund speichern');

    expect(dialog?.textContent).toContain('Hund hinzufügen');
    expect(dialog?.textContent).toContain('Bitte suche und wähle zuerst die Kund:in');
    expect(host.querySelector('#workPageDogCustomer')).not.toBeNull();
    expect(saveButton.disabled).toBeTrue();

    const customerInput = host.querySelector<HTMLInputElement>('#workPageDogCustomer')!;
    customerInput.value = 'mila';
    customerInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    httpTesting
      .expectOne(
        (request) =>
          request.url === `${runtimeConfig.apiBaseUrl}/customers` &&
          request.params.get('query') === 'mila' &&
          request.params.get('limit') === '6',
      )
      .flush([customerDto(8, 'Mila Muster', { email: 'mila.muster@example.local' })]);
    fixture.detectChanges();

    buttonByText(fixture, 'Mila Muster').click();
    fixture.detectChanges();
    const dogNameInput = host.querySelector<HTMLInputElement>('#workPageDogName')!;
    dogNameInput.value = 'Nala';
    dogNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(buttonByText(fixture, 'Hund speichern').disabled).toBeFalse();
    buttonByText(fixture, 'Hund speichern').click();
    fixture.detectChanges();

    const createRequest = httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers/8/pets`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(
      jasmine.objectContaining({ name: 'Nala', breed: '', size: '', groomingNotes: '' }),
    );
    createRequest.flush({ id: 12, ownerSubject: 'kunde-8', name: 'Nala' });
    fixture.detectChanges();
    tick(260);
    fixture.detectChanges();

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(host.textContent).toContain('Nala gespeichert');

    graphNodeButton(fixture, 'Hunde').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    if (!graphNodeLabels(fixture).includes('Hundeliste')) {
      graphNodeButton(fixture, 'Hunde').click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }
    graphNodeButton(fixture, 'Hundeliste').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const dogListRequest = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${runtimeConfig.apiBaseUrl}/dogs` &&
        candidate.params.get('limit') === '100',
    );
    expect(dogListRequest.request.method).toBe('GET');
    dogListRequest.flush([
      {
        dogId: 12,
        petId: 12,
        id: 12,
        name: 'Nala',
        dogName: 'Nala',
        customerId: 8,
        customerName: 'Mila Muster',
        customerDisplayName: 'Mila Muster',
        ownerDisplayName: 'Mila Muster',
        breed: 'Labradoodle',
        size: 'mittel',
        groomingNotes: null,
        imageBase64: null,
      },
    ]);
    fixture.detectChanges();

    expect(host.querySelector('[role="dialog"]')?.textContent).toContain('Nala');
    expect(host.querySelector('[role="dialog"]')?.textContent).toContain('Mila Muster');
  }));

  it('opens the same dog creation flow from a customer profile with the customer preselected', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([{ customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null }]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Profil').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[role="dialog"]')?.textContent).toContain('Katja Gross Profil');
    host.querySelector<HTMLButtonElement>('.customer-profile-read__dog-add')!.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const dogDialog = host.querySelector('[role="dialog"]');
    expect(dogDialog?.textContent).toContain('Hund hinzufügen');
    expect(dogDialog?.textContent).toContain('Katja Gross');
    expect(host.querySelector('#workPageDogCustomer')).toBeNull();

    const dogNameInput = host.querySelector<HTMLInputElement>('#workPageDogName')!;
    dogNameInput.value = 'Bruno';
    dogNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    buttonByText(fixture, 'Hund speichern').click();

    const createRequest = httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers/7/pets`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body.name).toBe('Bruno');
    createRequest.flush({ id: 13, ownerSubject: 'kunde-7', name: 'Bruno' });
    fixture.detectChanges();

    expect(host.textContent).toContain('Bruno gespeichert');
  }));

  it('opens a selected customer search result as a read-only profile with a route back to search', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);

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
    const headerDescription = dialog?.querySelector<HTMLElement>('.circular-work-page__description');

    expect(dialog?.textContent).toContain('Mila Muster Profil');
    expect(dialog?.textContent).not.toContain(
      'Lesemodus: Stammdaten und verfügbare Kontaktinformationen, ohne direkte Bearbeitung.',
    );
    expect(dialog?.textContent).not.toContain('Lesemodus · keine direkte Bearbeitung');
    expect(dialog?.textContent).toContain('Vorname');
    expect(dialog?.textContent).toContain('Mila');
    expect(dialog?.textContent).toContain('Nachname');
    expect(dialog?.textContent).toContain('Muster');
    expect(dialog?.textContent).toContain('mila.muster@example.local');
    expect(dialog?.textContent).toContain('+49 151 1000 1002');
    expect(dialog?.textContent).toContain('Zurück zur Suche');
    expect(dialog?.textContent).not.toContain('Nicht angeheftet');
    expect(dialog?.textContent).toContain('Als Favorit anheften');
    expect(headerDescription?.classList).toContain('circular-work-page__description--sr-only');
    expect(dialog?.querySelector('.customer-profile-read__mode')).toBeNull();
    expect(dialog?.querySelector('.customer-profile-read__favorite-state')).toBeNull();
    expect(dialog?.querySelector('.customer-profile-read .favorite-toggle')).toBeNull();
    expect(dialog?.querySelector('.customer-profile-read__back')).toBeNull();
    expect(dialog?.querySelector('.customer-profile-read__delete')).toBeNull();
    expect(
      Array.from(dialog!.querySelectorAll<HTMLButtonElement>('.circular-work-page__action')).map(
        (button) => button.getAttribute('aria-label'),
      ),
    ).toEqual([
      'Schließen',
      'Zurück zur Suche',
      'Mila Muster: Als Favorit anheften',
      'Mila Muster: Hund hinzufügen',
    ]);
    expect(dialog?.textContent).not.toContain('Speichern');
    expect(profile?.getAttribute('aria-label')).toBe('Mila Muster Kundenprofil im Lesemodus');
    expect(document.activeElement).toBe(profile);

    buttonByText(fixture, 'Zurück zur Suche').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(host.querySelector<HTMLInputElement>('#workPageCustomerSearch')?.value).toBe('muster');
    expect(document.activeElement).toBe(
      host.querySelector<HTMLInputElement>('#workPageCustomerSearch'),
    );
    expect(host.textContent).toContain('Mila Muster');
  }));

  it('opens a customer search result with Enter using the button screenreader name', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);

    setCustomerSearchTerm(fixture, 'katja');
    flushCustomerSearch('katja', [
      customerDto(7, 'Katja Gross', { email: 'katja.gross@example.local' }),
    ]);

    const result = customerSearchResultButtons(fixture)[0];
    expect(result.getAttribute('aria-label')).toBe(
      'Katja Gross, Kund:in, Kundenprofil im Lesemodus öffnen',
    );

    result.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Katja Gross Profil');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'katja.gross@example.local',
    );
    expect(document.activeElement).toBe(
      (fixture.nativeElement as HTMLElement).querySelector('#customerProfileReadMode'),
    );
  }));

  it('freezes and disables the background graph while a customer search result profile is open', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);
    setCustomerSearchTerm(fixture, 'mila');
    flushCustomerSearch('mila', [
      customerDto(8, 'Mila Muster', { email: 'mila.muster@example.local' }),
    ]);

    const graphHost = (fixture.nativeElement as HTMLElement).querySelector('gmf-workspace-graph');
    const graphLabelsBeforeProfileOpen = graphNodeLabels(fixture);
    const activeGraphLabelBeforeProfileOpen = normalizeText(
      activeGraphNodeButton(fixture)?.textContent,
    );
    const expandedNodeIdsBeforeProfileOpen = Array.from(
      (fixture.componentInstance as unknown as {
        expandedNodeIds: () => ReadonlySet<string>;
      }).expandedNodeIds(),
    ).sort();

    expect(graphHost?.getAttribute('inert')).toBe('');
    expect(graphHost?.getAttribute('aria-hidden')).toBe('true');
    expect(graphNodeButton(fixture, 'Kunden').disabled).toBeTrue();

    buttonByText(fixture, 'Mila Muster').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const profileDialog = host.querySelector('[role="dialog"]');

    expect(profileDialog?.textContent).toContain('Mila Muster Profil');
    expect(graphHost?.getAttribute('inert')).toBe('');
    expect(graphHost?.getAttribute('aria-hidden')).toBe('true');
    expect(graphNodeLabels(fixture)).toEqual(graphLabelsBeforeProfileOpen);
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe(
      activeGraphLabelBeforeProfileOpen,
    );

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toEqual(graphLabelsBeforeProfileOpen);
    expect(
      Array.from(
        (fixture.componentInstance as unknown as {
          expandedNodeIds: () => ReadonlySet<string>;
        }).expandedNodeIds(),
      ).sort(),
    ).toEqual(expandedNodeIdsBeforeProfileOpen);

    buttonByText(fixture, 'Schließen').click();
    tick(230);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(graphHost?.hasAttribute('inert')).toBeFalse();
    expect(graphNodeButton(fixture, 'Kunden').disabled).toBeFalse();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeButton(fixture, 'Kunden').getAttribute('aria-expanded')).toBe('false');
  }));

  it('shows at most six round customer search result nodes and asks to refine larger result sets', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain('Bitte gib einen Vor- oder Nachnamen ein.');
    expect(customerSearchResultButtons(fixture)).toHaveSize(0);

    setCustomerSearchTerm(fixture, 'testfamilie');
    flushCustomerSearch('testfamilie', testfamilieCustomers);

    const resultButtons = customerSearchResultButtons(fixture);

    expect(resultButtons).toHaveSize(6);
    expect(
      resultButtons.every(
        (button) => button.closest('.work-page-search__item--avatar-node') !== null,
      ),
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
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    fixture.detectChanges();

    expandCustomersNode(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain('Kunden hinzufügen');
    expect(dialog?.textContent).toContain('Name des Kunden');
    expect(dialog?.textContent).toContain('Speichern');
    expect(dialog?.textContent).toContain('Abbrechen');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('gmf-workspace-graph')
        ?.getAttribute('inert'),
    ).toBe('');

    buttonByText(fixture, 'Abbrechen').click();
    tick(230);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('gmf-workspace-graph')
        ?.hasAttribute('inert'),
    ).toBeFalse();
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Hinzufügen').getAttribute('aria-current')).toBeNull();
    expect(document.activeElement).toBe(activeGraphNodeButton(fixture));
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Mila Muster angeheftet',
    );
  }));

  it('creates a customer through the circular work page primary action using the customers API response id', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    expandCustomersNode(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const nameInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#workPageCustomerName',
    );
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
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    expandCustomersNode(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const nameInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#workPageCustomerName',
    );
    nameInput!.value = 'Mila Muster';
    nameInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonByText(fixture, 'Speichern').click();
    fixture.detectChanges();

    const createRequest = httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers`);
    expect(buttonByText(fixture, 'Speichern').disabled).toBeTrue();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[aria-busy="true"]'),
    ).not.toBeNull();

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
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    flushCustomerFavoritesIfRequested();
    fixture.detectChanges();

    expandCustomersNode(fixture);
    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();

    const nameInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#workPageCustomerName',
    );
    nameInput!.value = 'Mila Muster';
    nameInput!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonByText(fixture, 'Speichern').click();
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customers`)
      .flush({ detail: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    tick(230);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    expect(host.textContent).toContain(
      'Kunde konnte nicht gespeichert werden. Bitte versuche es erneut.',
    );
    expect(graphNodeLabels(fixture)).not.toContain('Mila Muster');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Kunden');
    expect(graphNodeButton(fixture, 'Hinzufügen').getAttribute('aria-current')).toBeNull();
    expect(buttonByText(fixture, 'Speichern').disabled).toBeFalse();

    buttonByText(fixture, 'Speichern').click();
    expect(httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers`).request.method).toBe(
      'POST',
    );
  }));

  it('toggles customer favorites as graph children without opening a round work page', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([
      { customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null },
      { customerId: 9, firstName: 'Alex', lastName: 'Sommer', profileImageBase64: null },
    ]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');

    expect(dialog).toBeNull();
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('true');
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-label')).toContain('Domäne');
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-label')).toContain(
      'aufgeklappt',
    );
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-label')).toContain(
      'kein separates Fenster',
    );
    expect(host.textContent).toContain('Favoriten ist aufgeklappt');
    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Favoriten', 'Katja Gross', 'Alex Sommer']),
    );
    expect(
      graphNodeButton(fixture, 'Katja Gross').querySelectorAll('.workspace-graph__label-line'),
    ).toHaveSize(2);
    expect(graphNodeButton(fixture, 'Katja Gross').getAttribute('aria-label')).toContain(
      'Katja Gross, Kunden-Instanz',
    );

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
  }));

  it('closes stale favorite subtrees when the customer add work page opens', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([{ customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null }]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Favoriten', 'Katja Gross', 'Profil']),
    );
    expect(graphNodeLabels(fixture)).not.toContain('Hinzufügen');

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');

    graphNodeButton(fixture, 'Hinzufügen').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      expandedNodeIds: () => ReadonlySet<string>;
    };
    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain('Kunden hinzufügen');
    expect(component.expandedNodeIds().has('customers')).toBeTrue();
    expect(component.expandedNodeIds().has('customer-favorites')).toBeFalse();
    expect(component.expandedNodeIds().has('7')).toBeFalse();
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
    expect(host.querySelector('[data-node-id="7-profile"]')).toBeNull();

    buttonByText(fixture, 'Abbrechen').click();
    tick(230);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeLabels(fixture)).toContain('Favoriten');
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('false');
  }));

  it('keeps an empty favorites node operable without opening an empty favorites dialog', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('true');
    expect(graphNodeLabels(fixture)).toEqual(jasmine.arrayContaining(['Kunden', 'Favoriten']));
    expect(graphNodeLabels(fixture)).not.toContain(
      'Noch keine Kund:innen vorhanden. Kund:in hinzufügen.',
    );
  }));

  it('toggles a personal favorite customer node without opening a profile directly', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([{ customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null }]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();

    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const favoriteCustomerButton = graphNodeButton(fixture, 'Katja Gross');

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(favoriteCustomerButton.getAttribute('aria-expanded')).toBe('true');
    expect(favoriteCustomerButton.getAttribute('aria-label')).toContain(
      'Click, Enter oder Space öffnet bzw. schließt angehängte Aktionsknoten',
    );
    expect(favoriteCustomerButton.getAttribute('aria-label')).toContain(
      'der Kunden-Instanzknoten öffnet kein Profil und kein separates Fenster',
    );
    expect(host.textContent ?? '').toContain(
      'Katja Gross ist aufgeklappt. Wähle einen Unterknoten, um eine Seite oder Aktion zu öffnen.',
    );
    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Katja Gross', 'Profil', 'Terminliste', 'X']),
    );

    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeButton(fixture, 'Katja Gross').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeLabels(fixture)).not.toContain('Profil');
  }));

  it('collapses all open favorite descendants when the top-level favorites node is closed', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([{ customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null }]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('true');
    expect(graphNodeButton(fixture, 'Katja Gross').getAttribute('aria-expanded')).toBe('true');
    expect(graphNodeLabels(fixture)).toEqual(
      jasmine.arrayContaining(['Favoriten', 'Katja Gross', 'Profil', 'Terminliste', 'Löschen', 'X']),
    );

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-label')).toContain(
      'eingeklappt',
    );
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
    expect(graphNodeLabels(fixture)).not.toContain('Profil');

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeButton(fixture, 'Favoriten').getAttribute('aria-expanded')).toBe('true');
    expect(graphNodeButton(fixture, 'Katja Gross').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeLabels(fixture)).not.toContain('Profil');
  }));

  it('collapses an expanded sibling customer subtree when another favorite customer is opened', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([
      { customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null },
      { customerId: 8, firstName: 'Alex', lastName: 'Sommer', profileImageBase64: null },
    ]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(graphNodeButton(fixture, 'Katja Gross').getAttribute('aria-expanded')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-node-id="7-profile"]')).not.toBeNull();

    graphNodeButton(fixture, 'Alex Sommer').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      expandedNodeIds: () => ReadonlySet<string>;
    };

    expect(component.expandedNodeIds().has('7')).toBeFalse();
    expect(component.expandedNodeIds().has('8')).toBeTrue();
    expect(graphNodeButton(fixture, 'Katja Gross').getAttribute('aria-expanded')).toBe('false');
    expect(graphNodeButton(fixture, 'Alex Sommer').getAttribute('aria-expanded')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-node-id="7-profile"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-node-id="8-profile"]')).not.toBeNull();
  }));

  it('opens a personal favorite customer profile only from the attached profile action node', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([{ customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null }]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const profileActionButton = graphNodeButton(fixture, 'Profil');
    expect(profileActionButton.getAttribute('aria-label')).toContain('Profil, Aktion');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Katja Gross');

    profileActionButton.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="dialog"]');
    const profile = host.querySelector<HTMLElement>('#customerProfileReadMode');

    expect(dialog?.textContent).toContain('Katja Gross Profil');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Katja Gross');
    expect(graphNodeButton(fixture, 'Profil').getAttribute('aria-current')).toBeNull();
    expect(graphNodeButton(fixture, 'Profil').getAttribute('aria-label')).not.toContain(
      'Aktiver Arbeitsknoten',
    );
    expect(dialog?.textContent).not.toContain('Lesemodus · keine direkte Bearbeitung');
    expect(dialog?.querySelector('.customer-profile-read__mode')).toBeNull();
    expect(dialog?.querySelector('.customer-profile-read__favorite-state')).toBeNull();
    expect(dialog?.textContent).toContain('Zum Kunden-Knoten');
    expect(host.textContent ?? '').toContain(
      'Das Profil ist zunächst als klarer Lesemodus geöffnet. Bearbeiten bleibt bewusst eine spätere Aktion.',
    );
    expect(profile?.getAttribute('aria-label')).toBe('Katja Gross Kundenprofil im Lesemodus');
    expect(document.activeElement).toBe(profile);
  }));

  it('opens a day planning calendar renderer stub from the calendar graph node', () => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
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
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`).flush([]);
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);

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

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Katja Gross ist jetzt dein persönlicher Favorit.',
    );
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
    expect(favoriteToggleButtons(fixture)[0].textContent).toContain('Aus Favoriten entfernen');

    favoriteToggleButtons(fixture)[0].click();
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites/7`).flush(null);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Katja Gross wurde aus deinen persönlichen Favoriten entfernt.',
    );
    expect(favoriteToggleButtons(fixture)[0].textContent).toContain('Als Favorit anheften');
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
  }));

  it('lets admins confirm and delete a customer from a customer action node', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'admin@grooming-manager.local',
      roles: ['ROLE_admin'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([
        {
          customerId: 7,
          firstName: 'Katja',
          lastName: 'Gross',
          email: 'katja.gross@example.local',
          profileImageBase64: null,
        },
      ]);
    fixture.detectChanges();

    openCustomerSearchFromGraph(fixture);
    setCustomerSearchTerm(fixture, 'katja');
    flushCustomerSearch('katja', [
      customerDto(7, 'Katja Gross', { email: 'katja.gross@example.local' }),
    ]);
    expect(customerSearchResultButtons(fixture)).toHaveSize(1);
    closeActiveWorkPage(fixture);

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
    expect(graphNodeLabels(fixture)).toContain('Löschen');

    graphNodeButton(fixture, 'Löschen').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe('Katja Gross');
    expect(graphNodeButton(fixture, 'Löschen').getAttribute('aria-current')).toBeNull();

    const confirmationDialog = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="dialog"]',
    );
    expect(confirmationDialog?.textContent).toContain('Katja Gross löschen');
    expect(confirmationDialog?.textContent).toContain('Diese Aktion ist destruktiv');
    expect(confirmationDialog?.textContent).toContain('katja.gross@example.local');

    buttonByText(fixture, 'Endgültig löschen').click();
    const deleteRequest = httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/customers/7`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    tick(230);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(host.textContent).toContain('Katja Gross gelöscht');
    expect(graphNodeLabels(fixture)).not.toContain('Katja Gross');
    expect(customerSearchResultButtons(fixture)).toHaveSize(0);
    expect(host.textContent).not.toContain('Favoritenstatus: Persönlicher Favorit');
  }));

  it('does not expose customer delete actions to groomers', fakeAsync(() => {
    auth.setRoles(['ROLE_groomer']);

    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'groomer@grooming-manager.local',
      roles: ['ROLE_groomer'],
    });
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .flush([{ customerId: 7, firstName: 'Katja', lastName: 'Gross', profileImageBase64: null }]);
    fixture.detectChanges();

    graphNodeButton(fixture, 'Favoriten').click();
    fixture.detectChanges();
    graphNodeButton(fixture, 'Katja Gross').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(graphNodeLabels(fixture)).not.toContain('Löschen');
    expect(host.textContent).not.toContain('Kund:in löschen');
    expect(host.textContent).not.toContain('Endgültig löschen');
  }));

  it('shows a friendly limit message when the favorites API rejects a seventh favorite', fakeAsync(() => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
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

    openCustomerSearchFromGraph(fixture);

    setCustomerSearchTerm(fixture, 'muster');
    flushCustomerSearch('muster', [customerDto(8, 'Mila Muster')]);

    favoriteToggleButtons(fixture)[0].click();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/customer-favorites/8`)
      .flush(
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
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
    httpTesting.expectOne(`${runtimeConfig.apiBaseUrl}/me`).flush({
      username: 'kunde@grooming-manager.local',
      roles: ['ROLE_kunde'],
    });
    fixture.detectChanges();

    graphNodeButton(fixture, 'Kunden').click();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toContain('Mein Profil');
    expect(graphNodeLabels(fixture)).not.toContain('Suchen');
    expect(graphNodeLabels(fixture)).not.toContain('Kundenliste');
    expect(graphNodeLabels(fixture)).not.toContain('Favoriten');
  });

  it('normalizes a fully expanded custom-flex graph when switching back to focused work', () => {
    fixture.detectChanges();
    httpTesting
      .expectOne(`${runtimeConfig.apiBaseUrl}/status`)
      .flush({ status: 'UP', service: 'backend' });
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

    expect(graphNodeLabels(fixture).length).toBe(31);
    expect(graphNodeLabels(fixture)).toContain('Groomer hinzufügen');

    buttonByText(fixture, 'Focused Work').click();
    fixture.detectChanges();

    expect(graphNodeLabels(fixture)).toEqual([
      'Start Schnittstelle 2',
      'Groomer',
      'Kalender',
      'Admin',
      'Kunden',
      'Favoriten',
      'Hunde',
    ]);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Groomer hinzufügen');
    expect(normalizeText(activeGraphNodeButton(fixture)?.textContent)).toBe(
      'Start Schnittstelle 2',
    );
  });
});

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../core/auth.service';
import { runtimeConfig } from '../../core/runtime-config';
import {
  CircularWorkPage,
  CircularWorkPageAction,
  CircularWorkPageContentType,
  CircularWorkPageOrigin,
} from '../../shared/circular-work-page/circular-work-page';
import {
  WorkspaceGraph,
  WorkspaceGraphNode,
  WorkspaceGraphSelection,
} from '../../shared/workspace-graph/workspace-graph';
import {
  buildDashboardGraphEdges,
  buildDashboardGraphNodes,
  customerDisplayName,
  dashboardGraphDescendantNodeIds,
  dashboardGraphSiblingSubtreeNodeIds,
  expandableDashboardGraphNodeIds,
  hasDashboardGraphChildren,
  isDashboardGraphFullyExpanded,
  isDashboardGraphWorkFocusNode,
  isFunctionalDashboardGraphNode,
  isTopLevelDashboardGraphNode,
  type DashboardGraphRole,
  type CustomerInstance,
  type DogInstance,
} from './dashboard-graph.model';

type MeResponse = {
  username: string;
  roles: string[];
};

type CustomerFavoriteDto = {
  customerId: number;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  communicationNotes?: string | null;
  profileImageBase64?: string | null;
};

type CustomerDto = {
  id: number;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  communicationNotes?: string | null;
  profileImageBase64?: string | null;
};

type PetDto = {
  id: number;
  dogId?: number | null;
  petId?: number | null;
  ownerSubject?: string | null;
  name: string;
  dogName?: string | null;
  breed?: string | null;
  size?: string | null;
  groomingNotes?: string | null;
  imageBase64?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  customerDisplayName?: string | null;
  ownerDisplayName?: string | null;
};

type PetFormState = {
  name: string;
  breed: string;
  size: string;
  groomingNotes: string;
  imageBase64: string;
  imageFileName: string;
  customerId: string;
};

type WorkspacePanelMode =
  | 'overview'
  | 'list'
  | 'search'
  | 'create'
  | 'profile'
  | 'delete'
  | 'selected'
  | 'dog-create'
  | 'dog-detail';
type WorkspaceLayoutMode = 'focused-work' | 'custom-flex';

type WorkspacePanel = {
  mode: WorkspacePanelMode;
  eyebrow: string;
  title: string;
  description: string;
  node?: WorkspaceGraphNode;
};

type WorkspaceWorkPage = {
  sourceNodeId: string;
  sourceLabel: string;
  sourceOrigin?: CircularWorkPageOrigin;
  contentType: CircularWorkPageContentType;
  title: string;
  description?: string;
  primaryActionLabel?: string;
  secondaryActionLabel: string;
  originLabel?: string;
  busy?: boolean;
  error?: string;
  empty?: boolean;
};

type LockedGraphPresentation = {
  nodes: WorkspaceGraphNode[];
  edges: ReturnType<typeof buildDashboardGraphEdges>;
  activeNodeId: string;
  centeredNodeId: string;
  expandedNodeIds: ReadonlySet<string>;
  expandableNodeIds: readonly string[];
  lockAnchoredNodesToAutoLayout: boolean;
  showFitToViewControl: boolean;
};

type CustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  meta: string;
  status: string;
  email?: string;
  phone?: string;
  note?: string;
  avatarUrl?: string;
};

type AgendaItem = {
  time: string;
  title: string;
  detail: string;
  status: string;
};

@Component({
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    CircularWorkPage,
    FormsModule,
    RouterLink,
    TableModule,
    TagModule,
    WorkspaceGraph,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly expandableDashboardGraphNodeIds = expandableDashboardGraphNodeIds;
  private readonly http = inject(HttpClient);
  private readonly hostElement: ElementRef<HTMLElement> = inject(ElementRef);

  @ViewChild(WorkspaceGraph, { read: ElementRef })
  private workspaceGraphElement?: ElementRef<HTMLElement>;

  protected readonly backendConnection = signal<'checking' | 'connected' | 'unavailable'>(
    'checking',
  );
  protected readonly me = signal<MeResponse | null>(null);
  protected readonly activeNodeId = signal('start');
  protected readonly expandedNodeIds = signal<ReadonlySet<string>>(new Set());
  protected readonly focusedTopLevelNodeId = signal<string | undefined>(undefined);
  protected readonly layoutMode = signal<WorkspaceLayoutMode>('focused-work');
  protected readonly selectedCustomer = signal<CustomerInstance | null>(null);
  protected readonly favoriteCustomers = signal<CustomerInstance[]>([]);
  protected readonly favoriteStatusMessage = signal('');
  protected readonly favoriteOperationBusyCustomerIds = signal<ReadonlySet<string>>(new Set());
  protected readonly newCustomerName = signal('');
  protected readonly customerCreateBusy = signal(false);
  protected readonly customerCreateError = signal('');
  protected readonly customerSearchTerm = signal('');
  protected readonly customerSearchResults = signal<CustomerListItem[]>([]);
  protected readonly customerSearchBusy = signal(false);
  protected readonly customerSearchError = signal('');
  protected readonly customerListItems = signal<CustomerListItem[]>([]);
  protected readonly customerListBusy = signal(false);
  protected readonly customerListError = signal('');
  protected readonly customerListPageSize = 30;
  protected readonly customerListFetchLimit = 100;
  protected readonly customerDeleteBusy = signal(false);
  protected readonly customerDeleteError = signal('');
  protected readonly selectedDog = signal<DogInstance | null>(null);
  protected readonly dogContextDogs = signal<DogInstance[]>([]);
  protected readonly dogSearchTerm = signal('');
  protected readonly dogSearchResults = signal<DogInstance[]>([]);
  protected readonly dogSearchBusy = signal(false);
  protected readonly dogSearchError = signal('');
  protected readonly dogListItems = signal<DogInstance[]>([]);
  protected readonly dogListBusy = signal(false);
  protected readonly dogListError = signal('');
  protected readonly dogSearchResultLimit = 6;
  protected readonly dogListFetchLimit = 100;
  protected readonly dogCreateBusy = signal(false);
  protected readonly dogCreateError = signal('');
  protected readonly dogCreateStatusMessage = signal('');
  protected readonly dogImageError = signal('');
  protected readonly dogForm = signal<PetFormState>(this.emptyPetForm());
  protected readonly dogSelectedCustomer = signal<CustomerInstance | null>(null);
  protected readonly dogCustomerSearchTerm = signal('');
  protected readonly dogCustomerSearchResults = signal<CustomerListItem[]>([]);
  protected readonly dogCustomerSearchBusy = signal(false);
  protected readonly dogCustomerSearchError = signal('');
  protected readonly dogCustomerSearchResultLimit = 6;
  protected readonly customerSearchResultLimit = 6;
  protected readonly dailyAgendaItems: AgendaItem[] = [
    {
      time: '09:00',
      title: 'Katja Gross · Nala',
      detail: 'Waschen, Schneiden · 75 min',
      status: 'Bestätigt',
    },
    {
      time: '11:00',
      title: 'Mila Muster · Bruno',
      detail: 'Krallen, Ohren · 30 min',
      status: 'Anfrage',
    },
    {
      time: '14:30',
      title: 'Alex Sommer · Loki',
      detail: 'Komplettpflege · 90 min',
      status: 'Geplant',
    },
  ];
  protected readonly activeWorkPage = signal<WorkspaceWorkPage | null>(null);
  protected readonly visibleCustomerSearchResults = computed(() =>
    this.customerSearchResults().slice(0, this.customerSearchResultLimit),
  );
  protected readonly customerSearchOverflowMessage = computed(() => {
    const totalResultCount = this.customerSearchResults().length;

    if (totalResultCount <= this.customerSearchResultLimit) {
      return '';
    }

    return `${totalResultCount} Kunden gefunden. Bitte Suche verfeinern`;
  });
  protected readonly customerSearchEmptyMessage = computed(() => {
    if (!this.customerSearchTerm().trim()) {
      return 'Bitte gib einen Vor- oder Nachnamen ein.';
    }

    return 'Keine Kund:innen für diese Suche gefunden.';
  });
  protected readonly visibleDogSearchResults = computed(() =>
    this.dogSearchResults().slice(0, this.dogSearchResultLimit),
  );
  protected readonly dogSearchOverflowMessage = computed(() => {
    const totalResultCount = this.dogSearchResults().length;

    if (totalResultCount <= this.dogSearchResultLimit) {
      return '';
    }

    return `${totalResultCount} Hunde gefunden. Bitte Suche verfeinern`;
  });
  protected readonly dogSearchEmptyMessage = computed(() => {
    if (!this.dogSearchTerm().trim()) {
      return 'Bitte gib einen Hundenamen oder Kundenbezug ein.';
    }

    return 'Keine Hunde für diese Suche gefunden.';
  });
  protected readonly selectedDogCustomer = computed(() => this.dogSelectedCustomer());
  protected readonly selectedDogCustomerLabel = computed(() => {
    const selectedCustomer = this.selectedDogCustomer();

    return selectedCustomer ? customerDisplayName(selectedCustomer) : '';
  });
  protected readonly visibleDogCustomerSearchResults = computed(() =>
    this.dogCustomerSearchResults().slice(0, this.dogCustomerSearchResultLimit),
  );
  protected readonly dogCustomerSearchEmptyMessage = computed(() => {
    if (!this.dogCustomerSearchTerm().trim()) {
      return 'Bitte suche und wähle zuerst die Kund:in für diesen Hund.';
    }

    return 'Keine Kund:innen für diese Suche gefunden.';
  });
  protected readonly dogFormCustomerMissing = computed(() => !this.dogForm().customerId);
  protected readonly dogFormInvalid = computed(
    () => !this.dogForm().name.trim() || this.dogFormCustomerMissing(),
  );
  protected readonly workspacePanel = signal<WorkspacePanel>({
    mode: 'overview',
    eyebrow: 'Start',
    title: 'Arbeitsbereich wählen',
    description:
      'Wähle einen Kreis im Graphen. Domänenknoten öffnen Listen/Seitenkontexte, Aktionsknoten öffnen Formulare oder führen Arbeitsaktionen aus.',
  });
  protected readonly roleLabel = computed(() =>
    this.resolveRoleLabel(this.me()?.roles ?? this.auth.roles(), this.preferredUsername()),
  );
  protected readonly graphRole = computed<DashboardGraphRole>(() =>
    this.resolveGraphRole(this.me()?.roles ?? this.auth.roles(), this.preferredUsername()),
  );
  protected readonly selectedCustomerLabel = computed(() => {
    const customer = this.selectedCustomer();

    return customer ? customerDisplayName(customer) : '';
  });
  protected readonly backendConnectionLabel = computed(() => {
    if (this.backendConnection() === 'connected') {
      return 'Backend verbunden';
    }

    if (this.backendConnection() === 'unavailable') {
      return 'Backend nicht erreichbar';
    }

    return 'Backend wird geprüft';
  });
  protected readonly backendConnectionSeverity = computed(() =>
    this.backendConnection() === 'connected'
      ? 'success'
      : this.backendConnection() === 'unavailable'
        ? 'danger'
        : 'warn',
  );
  protected readonly roleLinks = computed(() => [
    {
      label: 'Admin-Bereich',
      route: '/admin',
      icon: 'pi-shield',
      visible: this.auth.hasRole('ROLE_admin'),
    },
    {
      label: 'Groomer-Bereich',
      route: '/groomer',
      icon: 'pi-calendar',
      visible: this.auth.hasRole('ROLE_groomer'),
    },
    {
      label: 'Kund:innen-Bereich',
      route: '/kunde',
      icon: 'pi-user',
      visible: this.auth.hasRole('ROLE_kunde'),
    },
  ]);
  protected readonly graphNodes = computed<WorkspaceGraphNode[]>(() =>
    buildDashboardGraphNodes(
      this.favoriteCustomers(),
      this.expandedNodeIds(),
      this.layoutMode() === 'focused-work' ? this.focusedTopLevelNodeId() : undefined,
      this.graphRole(),
      this.dogContextDogs(),
    ),
  );
  protected readonly graphEdges = computed(() =>
    buildDashboardGraphEdges(
      this.favoriteCustomers(),
      this.expandedNodeIds(),
      this.graphRole(),
      this.dogContextDogs(),
    ),
  );
  protected readonly hasActiveWorkPage = computed(() => this.activeWorkPage() !== null);
  protected readonly graphInteractionLocked = computed(() => this.hasActiveWorkPage());
  private readonly focusedWorkCenteredNodeId = computed(() => {
    const activeNodeId = this.activeNodeId();

    if (this.dogContextDogs().some((dog) => dog.id === activeNodeId)) {
      return 'dogs';
    }

    return activeNodeId;
  });
  protected readonly presentedGraphNodes = computed(
    () => this.lockedGraphPresentation()?.nodes ?? this.graphNodes(),
  );
  protected readonly presentedGraphEdges = computed(
    () => this.lockedGraphPresentation()?.edges ?? this.graphEdges(),
  );
  protected readonly presentedActiveNodeId = computed(
    () => this.lockedGraphPresentation()?.activeNodeId ?? this.activeNodeId(),
  );
  protected readonly presentedCenteredNodeId = computed(
    () =>
      this.lockedGraphPresentation()?.centeredNodeId ??
      (this.layoutMode() === 'focused-work' ? this.focusedWorkCenteredNodeId() : ''),
  );
  protected readonly presentedExpandedNodeIds = computed(
    () => this.lockedGraphPresentation()?.expandedNodeIds ?? this.expandedNodeIds(),
  );
  protected readonly presentedExpandableNodeIds = computed(
    () =>
      this.lockedGraphPresentation()?.expandableNodeIds ??
      expandableDashboardGraphNodeIds(this.favoriteCustomers(), this.graphRole(), this.dogContextDogs()),
  );
  protected readonly presentedLockAnchoredNodesToAutoLayout = computed(
    () =>
      this.lockedGraphPresentation()?.lockAnchoredNodesToAutoLayout ??
      this.layoutMode() === 'focused-work',
  );
  protected readonly presentedShowFitToViewControl = computed(
    () =>
      this.lockedGraphPresentation()?.showFitToViewControl ?? this.layoutMode() === 'custom-flex',
  );
  private readonly lockedGraphPresentation = signal<LockedGraphPresentation | null>(null);
  private focusNodeAfterWorkPageClose: string | null = null;
  private customerSearchBusyTimer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    this.http.get(`${runtimeConfig.apiBaseUrl}/status`).subscribe({
      next: () => this.backendConnection.set('connected'),
      error: () => this.backendConnection.set('unavailable'),
    });
    if (this.auth.isAuthenticated()) {
      this.http.get<MeResponse>(`${runtimeConfig.apiBaseUrl}/me`).subscribe((me) => {
        this.me.set(me);
        this.loadCustomerFavorites();
      });
    }
  }

  protected handleGraphSelection(selection: WorkspaceGraphSelection): void {
    if (this.graphInteractionLocked()) {
      return;
    }

    const node = selection.node;
    const hasChildren = hasDashboardGraphChildren(
      node.id,
      this.favoriteCustomers(),
      this.graphRole(),
      this.dogContextDogs(),
    );
    const isStructuralNode = hasChildren && !isFunctionalDashboardGraphNode(node);
    const canBecomeWorkFocus = this.canBecomeActiveWorkFocus(node);

    if (canBecomeWorkFocus) {
      this.activeNodeId.set(node.id);
    }

    if (isTopLevelDashboardGraphNode(node.id)) {
      this.collapseOtherTopLevelSubtrees(node.id);
    }

    if (this.layoutMode() === 'focused-work' && isTopLevelDashboardGraphNode(node.id)) {
      this.focusedTopLevelNodeId.set(node.id);
    }

    if (this.layoutMode() === 'custom-flex' && node.id === 'start') {
      this.toggleEntireGraph();
      return;
    }

    if (isStructuralNode) {
      if (this.layoutMode() === 'focused-work' && isTopLevelDashboardGraphNode(node.id)) {
        this.focusTopLevelExpansion(node.id);
      } else {
        this.toggleExpandedNode(node.id);
      }

      this.workspacePanel.set({
        mode: 'overview',
        eyebrow: this.panelEyebrow(node),
        title: node.label,
        description: this.expandedNodeIds().has(node.id)
          ? `${node.label} ist aufgeklappt. Wähle einen Unterknoten, um eine Seite oder Aktion zu öffnen.`
          : `${node.label} ist zugeklappt. Beim Klick auf Strukturknoten wird keine Seite geöffnet.`,
        node,
      });
      return;
    }

    if (hasChildren) {
      this.toggleExpandedNode(node.id);
    }

    if (node.id === 'customer-list') {
      this.openCustomerListWorkPage(node, selection.sourceOrigin);
      this.workspacePanel.set({
        mode: 'list',
        eyebrow: 'Kundenaktion',
        title: 'Kundenliste geöffnet',
        description:
          'Die Kundenliste ist als runde Work-Page mit tabellarischer 30er-Paginierung geöffnet.',
        node,
      });
      return;
    }

    if (node.id === 'customer-search') {
      this.openCustomerSearchWorkPage(node, selection.sourceOrigin);
      this.workspacePanel.set({
        mode: 'search',
        eyebrow: 'Kundenaktion',
        title: 'Kundensuche geöffnet',
        description:
          'Suche Kund:innen über Vor- oder Nachname. Ergebnisse können als Arbeitsknoten am Favoritenbereich angeheftet werden.',
        node,
      });
      return;
    }

    if (node.id === 'customer-add') {
      this.openCustomerCreateWorkPage(node, selection.sourceOrigin);
      this.workspacePanel.set({
        mode: 'create',
        eyebrow: 'Kundenaktion',
        title: 'Kunden hinzufügen',
        description:
          'Das Formular ist als runde Work-Page über dem Graphen geöffnet. Nach dem Speichern erscheint der neue Kunde als Instanzknoten am Kunden-Domänenknoten.',
        node,
      });
      return;
    }

    if (node.id === 'dog-list') {
      this.openDogListWorkPage(node, selection.sourceOrigin);
      this.workspacePanel.set({
        mode: 'list',
        eyebrow: 'Hundeaktion',
        title: 'Hundeliste geöffnet',
        description:
          'Die Hundeliste ist als runde Work-Page geöffnet. Jeder Eintrag nennt Hund und Kundenbezug.',
        node,
      });
      return;
    }

    if (node.id === 'dog-search') {
      this.openDogSearchWorkPage(node, selection.sourceOrigin);
      this.workspacePanel.set({
        mode: 'search',
        eyebrow: 'Hundeaktion',
        title: 'Hundesuche geöffnet',
        description:
          'Suche Hunde über Name oder Kundenbezug. Gefundene Hunde öffnen einen konkreten Hund-Kontext am Hunde-Knoten.',
        node,
      });
      return;
    }

    if (this.isDogCreateNodeId(node.id)) {
      const customer = this.customerFromNode(node) ?? this.selectedCustomer();

      this.openDogCreateWorkPage(node, selection.sourceOrigin, customer ?? undefined);
      this.workspacePanel.set({
        mode: 'dog-create',
        eyebrow: 'Hundeaktion',
        title: 'Hund hinzufügen',
        description: customer
          ? `${customerDisplayName(customer)} ist als Kund:in vorbelegt. Das Formular bleibt dieselbe runde Hund-Erfassung.`
          : 'Bitte suche und wähle zuerst die Kund:in, bevor das Hundeprofil gespeichert werden kann.',
        node,
      });
      return;
    }

    if (node.id === 'appointments') {
      this.openDailyAgendaWorkPage(node, selection.sourceOrigin);
      this.workspacePanel.set({
        mode: 'list',
        eyebrow: 'Tagesplanung',
        title: 'Tagesplanung geöffnet',
        description:
          'Die Agenda ist ein Kalender-Renderer-Stub ohne echte Kalenderlogik. Sie bereitet Tagesnavigation und scrollbare Termine vor.',
        node,
      });
      return;
    }

    if (node.id.endsWith('-profile')) {
      const customer = this.customerFromNode(node) ?? this.selectedCustomer();

      if (customer) {
        this.selectedCustomer.set(customer);
        this.openCustomerProfileReadPage(
          customer,
          node,
          selection.sourceOrigin,
          'Zum Kunden-Knoten',
        );
      }

      this.workspacePanel.set({
        mode: 'profile',
        eyebrow: 'Kundenprofil',
        title: `${customer ? customerDisplayName(customer) : 'Kunde'} ansehen`,
        description:
          'Das Profil ist zunächst als klarer Lesemodus geöffnet. Bearbeiten bleibt bewusst eine spätere Aktion.',
        node,
      });
      return;
    }

    if (node.id.endsWith('-delete')) {
      const customer = this.customerFromNode(node) ?? this.selectedCustomer();

      if (customer && this.canDeleteCustomers()) {
        this.selectedCustomer.set(customer);
        this.openCustomerDeleteConfirmationPage(customer, node, selection.sourceOrigin);
      }

      this.workspacePanel.set({
        mode: 'delete',
        eyebrow: 'Kundenaktion',
        title: `${customer ? customerDisplayName(customer) : 'Kunde'} löschen`,
        description:
          customer && this.canDeleteCustomers()
            ? 'Die Löschbestätigung ist als runde Work-Page geöffnet. Erst die Bestätigung ruft die Backend-Löschfunktion auf.'
            : 'Diese destruktive Aktion ist nur für Admins verfügbar.',
        node,
      });
      return;
    }

    if (node.id.endsWith('-detach')) {
      const customer = this.customerFromNode(node) ?? this.selectedCustomer();

      this.removeFavoriteCustomer(customer);

      this.selectedCustomer.set(null);
      this.activeNodeId.set('customer-favorites');
      this.workspacePanel.set({
        mode: 'overview',
        eyebrow: 'Kunden',
        title: 'Kundenknoten gelöst',
        description:
          'Der konkrete Kunde wurde nur aus dem Arbeitsgraphen entfernt. Die Domäne und ihre Aktionen bleiben bestehen.',
        node,
      });
      return;
    }

    if (node.id.endsWith('-details')) {
      const dog = this.dogFromNode(node) ?? this.selectedDog();

      if (dog) {
        this.selectedDog.set(dog);
        this.openDogDetailWorkPage(dog, node, selection.sourceOrigin);
      }

      this.workspacePanel.set({
        mode: 'dog-detail',
        eyebrow: 'Hundekontext',
        title: dog ? `${dog.name} ansehen` : 'Hund ansehen',
        description: dog
          ? `${dog.name} gehört zu ${dog.customerLabel}. Details sind als runde Work-Page geöffnet.`
          : 'Dieser Hundeknoten öffnet Details nur, wenn ein Hund-Kontext vorhanden ist.',
        node,
      });
      return;
    }

    if (node.kind === 'instance') {
      const dog = this.dogFromNode(node);

      if (dog) {
        this.selectedDog.set(dog);
        this.toggleExpandedNode(node.id);
        this.workspacePanel.set({
          mode: 'selected',
          eyebrow: 'Hundekontext',
          title: `${dog.name} ausgewählt`,
          description:
            `${dog.name} gehört zu ${dog.customerLabel}. Klappe den Hundeknoten auf und wähle Details oder Termin explizit aus.`,
          node,
        });
        return;
      }

      const customer = this.customerFromNode(node);

      if (customer) {
        this.selectedCustomer.set(customer);
      }

      this.workspacePanel.set({
        mode: 'selected',
        eyebrow: 'Angeheftete Instanz',
        title: customer ? `${customerDisplayName(customer)} ausgewählt` : node.label,
        description: customer
          ? 'Der Favoriten-Kundenknoten ist ein Kontextknoten. Klappe seine Aktionen auf und wähle Profil, Terminliste, Entfernen oder eine Rollenaktion explizit aus.'
          : 'Dieser Kreis steht für ein konkretes Domänenobjekt, an dem gerade gearbeitet wird. Daran hängen kontextspezifische Aktionen.',
        node,
      });
      return;
    }

    this.workspacePanel.set({
      mode: node.kind === 'domain' || node.kind === 'page' ? 'list' : 'overview',
      eyebrow: this.panelEyebrow(node),
      title: node.label,
      description: node.description ?? 'Graphknoten ausgewählt.',
      node,
    });
  }

  protected createCustomer(): void {
    if (this.customerCreateBusy()) {
      return;
    }

    const name = this.newCustomerName().trim() || 'Neuer Kunde';

    this.customerCreateBusy.set(true);
    this.customerCreateError.set('');
    this.updateActiveWorkPageState({ busy: true, error: '' });
    this.http
      .post<CustomerDto>(`${runtimeConfig.apiBaseUrl}/customers`, { displayName: name })
      .subscribe({
        next: (createdCustomer) => {
          const customer = this.customerInstanceFromDto(createdCustomer);

          this.selectedCustomer.set(customer);
          this.pinFavoriteCustomerLocally(customer);
          this.expandNode('customers');
          this.expandNode('customer-favorites');
          this.expandNode(customer.id);
          this.newCustomerName.set('');
          this.activeNodeId.set(customer.id);
          this.focusNodeAfterWorkPageClose = customer.id;
          this.workspacePanel.set({
            mode: 'selected',
            eyebrow: 'Kundeninstanz',
            title: `${customerDisplayName(customer)} angeheftet`,
            description:
              'Der neue Kunde wurde als konkreter Instanzknoten mit Profil-, Löschen- und Entfernen-Aktionen an den Kundenknoten gehängt.',
          });
          this.activeWorkPage.set(null);
          this.unlockGraphPresentation();
          setTimeout(() => this.focusWorkspaceNode(customer.id), 250);
        },
        error: () => {
          this.customerCreateError.set(
            'Kunde konnte nicht gespeichert werden. Bitte versuche es erneut.',
          );
          this.customerCreateBusy.set(false);
          this.activeNodeId.set(this.focusableContextNodeIdForNodeId('customer-add'));
          this.updateActiveWorkPageState({
            busy: false,
            error: 'Kunde konnte nicht gespeichert werden. Bitte versuche es erneut.',
          });
        },
        complete: () => {
          this.customerCreateBusy.set(false);
          if (!this.customerCreateError()) {
            this.updateActiveWorkPageState({ busy: false });
          }
        },
      });
  }

  protected updateDogForm(field: keyof PetFormState, value: string): void {
    this.dogForm.update((form) => ({ ...form, [field]: value }));
    this.dogCreateError.set('');
    this.updateActiveWorkPageState({ error: '' });
  }

  protected updateDogCustomerSearchTerm(searchTerm: string): void {
    this.dogCustomerSearchTerm.set(searchTerm);
    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) {
      this.dogCustomerSearchResults.set([]);
      this.dogCustomerSearchError.set('');
      this.dogCustomerSearchBusy.set(false);
      return;
    }

    this.dogCustomerSearchBusy.set(true);
    this.dogCustomerSearchError.set('');
    this.http
      .get<CustomerDto[]>(`${runtimeConfig.apiBaseUrl}/customers`, {
        params: { query: trimmedSearchTerm, limit: String(this.dogCustomerSearchResultLimit) },
      })
      .subscribe({
        next: (customers) => {
          this.dogCustomerSearchResults.set(
            customers.map((customer) => this.customerListItemFromDto(customer)),
          );
        },
        error: () => {
          this.dogCustomerSearchResults.set([]);
          this.dogCustomerSearchError.set(
            'Kund:innen konnten nicht geladen werden. Bitte versuche es erneut.',
          );
        },
        complete: () => this.dogCustomerSearchBusy.set(false),
      });
  }

  protected selectDogCustomer(customer: CustomerListItem): void {
    const customerInstance = this.customerInstanceFromCustomer(customer);

    this.dogSelectedCustomer.set(customerInstance);
    this.updateDogForm('customerId', customer.id);
    this.dogCustomerSearchTerm.set(customer.name);
    this.dogCustomerSearchResults.set([]);
  }

  protected clearDogCustomerSelection(): void {
    this.dogSelectedCustomer.set(null);
    this.updateDogForm('customerId', '');
    this.dogCustomerSearchTerm.set('');
    this.dogCustomerSearchResults.set([]);
  }

  protected handleDogImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.dogImageError.set('');
    if (!file) {
      this.updateDogForm('imageBase64', '');
      this.updateDogForm('imageFileName', '');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.dogImageError.set('Bitte JPG, PNG oder WebP als Hundebild auswählen.');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.dogImageError.set('Das Hundebild darf maximal 2 MB groß sein.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;

      this.updateDogForm('imageBase64', base64);
      this.updateDogForm('imageFileName', file.name);
    };
    reader.onerror = () => {
      this.dogImageError.set('Hundebild konnte nicht gelesen werden. Bitte wähle eine andere Datei.');
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  protected createDog(): void {
    const form = this.dogForm();

    if (this.dogCreateBusy() || this.dogFormInvalid()) {
      this.dogCreateError.set(
        this.dogFormCustomerMissing()
          ? 'Bitte wähle zuerst die Kund:in aus, der dieser Hund gehört.'
          : 'Bitte gib mindestens den Namen des Hundes ein.',
      );
      this.updateActiveWorkPageState({ error: this.dogCreateError() });
      return;
    }

    this.dogCreateBusy.set(true);
    this.dogCreateError.set('');
    this.updateActiveWorkPageState({ busy: true, error: '' });
    this.http
      .post<PetDto>(`${runtimeConfig.apiBaseUrl}/customers/${form.customerId}/pets`, {
        name: form.name.trim(),
        breed: form.breed.trim(),
        size: form.size.trim(),
        groomingNotes: form.groomingNotes.trim(),
        imageBase64: form.imageBase64,
      })
      .subscribe({
        next: (createdPet) => {
          const customer = this.dogSelectedCustomer();
          const savedDog = this.dogInstanceFromDto({
            ...createdPet,
            customerId: createdPet.customerId ?? Number(form.customerId),
            customerDisplayName:
              createdPet.customerDisplayName ?? (customer ? customerDisplayName(customer) : null),
          });
          const customerLabel = savedDog.customerLabel;

          this.dogCreateStatusMessage.set(`${savedDog.name} wurde für ${customerLabel} gespeichert.`);
          this.pinDogContextLocally(savedDog);
          this.dogListItems.update((dogs) => [
            savedDog,
            ...dogs.filter((candidate) => candidate.id !== savedDog.id),
          ]);
          if (customer) {
            this.pinFavoriteCustomerLocally(customer);
            this.selectedCustomer.set(customer);
            this.expandNode('customer-favorites');
            this.expandNode(customer.id);
            this.activeNodeId.set(customer.id);
            this.focusNodeAfterWorkPageClose = customer.id;
          } else {
            this.activeNodeId.set('dogs');
            this.focusNodeAfterWorkPageClose = 'dogs';
          }
          this.workspacePanel.set({
            mode: 'selected',
            eyebrow: 'Hundeprofil',
            title: `${savedDog.name} gespeichert`,
            description: `${savedDog.name} wurde persistent für ${customerLabel} gespeichert und ist über die Backend-Hundeliste auffindbar.`,
          });
          this.resetDogForm();
          this.activeWorkPage.set(null);
          this.unlockGraphPresentation();
          setTimeout(() => this.focusWorkspaceNode(this.focusNodeAfterWorkPageClose ?? 'dogs'), 250);
        },
        error: () => {
          const errorMessage =
            'Hund konnte nicht gespeichert werden. Bitte prüfe die Eingaben und versuche es erneut.';

          this.dogCreateError.set(errorMessage);
          this.updateActiveWorkPageState({ busy: false, error: errorMessage });
        },
        complete: () => this.dogCreateBusy.set(false),
      });
  }

  protected deleteSelectedCustomer(): void {
    const customer = this.selectedCustomer();

    if (!customer || !this.canDeleteCustomers() || this.customerDeleteBusy()) {
      return;
    }

    this.customerDeleteBusy.set(true);
    this.customerDeleteError.set('');
    this.updateActiveWorkPageState({ busy: true, error: '' });
    this.http.delete<void>(`${runtimeConfig.apiBaseUrl}/customers/${customer.id}`).subscribe({
      next: () => {
        this.removeDeletedCustomerLocally(customer);
        this.customerDeleteBusy.set(false);
        this.customerDeleteError.set('');
        this.favoriteStatusMessage.set(`${customerDisplayName(customer)} wurde gelöscht.`);
        this.activeNodeId.set('customers');
        this.focusNodeAfterWorkPageClose = 'customers';
        this.workspacePanel.set({
          mode: 'overview',
          eyebrow: 'Kundenverwaltung',
          title: `${customerDisplayName(customer)} gelöscht`,
          description:
            'Die Kund:in wurde aus Suche, Favoritenanzeige und Detailkontext entfernt. Der Kundenbereich bleibt ohne kaputte Detailansicht geöffnet.',
        });
        this.activeWorkPage.set(null);
        this.unlockGraphPresentation();
        setTimeout(() => this.focusWorkspaceNode('customers'), 250);
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = this.customerDeleteErrorMessage(error);

        this.customerDeleteBusy.set(false);
        this.customerDeleteError.set(errorMessage);
        this.updateActiveWorkPageState({ busy: false, error: errorMessage });
      },
    });
  }

  protected selectCustomerSearchResult(customer: CustomerListItem): void {
    const customerInstance = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      meta: customer.meta,
      status: customer.status,
      note: customer.note,
      avatarUrl: customer.avatarUrl,
    };

    this.selectedDog.set(null);
    this.selectedCustomer.set(customerInstance);
    this.expandNode('customers');
    this.activeNodeId.set(customer.id);
    this.openCustomerProfileReadPage(
      customerInstance,
      this.activeWorkPageSourceNode(),
      undefined,
      'Schließen',
    );
    this.workspacePanel.set({
      mode: 'profile',
      eyebrow: 'Kundensuche',
      title: `${customer.name} im Lesemodus`,
      description:
        'Der gefundene Kunde wurde ohne globalen Favoritenstatus geöffnet. Groomer/Admins können ihn persönlich anheften.',
    });
  }

  protected selectDogResult(dog: DogInstance): void {
    this.selectedDog.set(dog);
    this.pinDogContextLocally(dog);
    this.expandNode('dogs');
    this.expandNode(dog.id);
    this.activeNodeId.set(dog.id);
    this.focusNodeAfterWorkPageClose = dog.id;
    this.activeWorkPage.set(null);
    this.unlockGraphPresentation();
    this.workspacePanel.set({
      mode: 'selected',
      eyebrow: 'Hundekontext',
      title: `${dog.name} geöffnet`,
      description: `${dog.name} gehört zu ${dog.customerLabel}. Der konkrete Hund-Kontext ist am Hunde-Knoten sichtbar.`,
    });
    setTimeout(() => this.focusWorkspaceNode(dog.id), 250);
  }

  protected toggleFavoriteCustomer(
    customer: CustomerInstance | CustomerListItem,
    event?: Event,
  ): void {
    event?.stopPropagation();
    if (!this.canManageCustomers()) {
      return;
    }

    const customerInstance = this.customerInstanceFromCustomer(customer);
    if (this.isFavoriteCustomer(customerInstance)) {
      this.removeFavoriteCustomer(customerInstance);
      return;
    }

    this.pinFavoriteCustomer(customerInstance);
  }

  protected isFavoriteCustomer(customer: CustomerInstance | CustomerListItem): boolean {
    return this.favoriteCustomers().some((favorite) => favorite.id === customer.id);
  }

  protected favoriteActionLabel(customer: CustomerInstance | CustomerListItem): string {
    return this.isFavoriteCustomer(customer) ? 'Aus Favoriten entfernen' : 'Als Favorit anheften';
  }

  protected favoriteStatusLabel(customer: CustomerInstance | CustomerListItem): string {
    return this.isFavoriteCustomer(customer) ? 'Persönlicher Favorit' : 'Nicht angeheftet';
  }

  protected isFavoriteOperationBusy(customer: CustomerInstance | CustomerListItem): boolean {
    return this.favoriteOperationBusyCustomerIds().has(customer.id);
  }

  protected customerProfileFieldValue(value: string | undefined): string {
    return value?.trim() || 'Nicht hinterlegt';
  }

  protected customerListFieldValue(value: string | undefined): string {
    return value?.trim() || 'Nicht hinterlegt';
  }

  protected selectedCustomerLabelFor(customer: CustomerInstance): string {
    return customerDisplayName(customer);
  }

  protected isDogCreateWorkPage(workPage: WorkspaceWorkPage): boolean {
    return this.isDogCreateNodeId(workPage.sourceNodeId);
  }

  protected openDogCreateFromCustomerProfile(customer: CustomerInstance): void {
    this.openDogCreateWorkPageFromSelectedCustomer(customer);
  }

  protected updateCustomerSearchTerm(searchTerm: string): void {
    this.customerSearchTerm.set(searchTerm);
    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) {
      this.clearCustomerSearchBusyTimer();
      this.customerSearchResults.set([]);
      this.customerSearchError.set('');
      this.customerSearchBusy.set(false);
      this.updateActiveWorkPageState({ busy: false, error: '', empty: false });
      return;
    }

    this.customerSearchBusy.set(true);
    this.customerSearchError.set('');
    this.clearCustomerSearchBusyTimer();
    this.customerSearchBusyTimer = setTimeout(() => {
      this.updateActiveWorkPageState({ busy: true, error: '', empty: false });
    });
    this.http
      .get<CustomerDto[]>(`${runtimeConfig.apiBaseUrl}/customers`, {
        params: { query: trimmedSearchTerm, limit: String(this.customerSearchResultLimit + 1) },
      })
      .subscribe({
        next: (customers) => {
          this.clearCustomerSearchBusyTimer();
          this.customerSearchResults.set(
            customers.map((customer) => this.customerListItemFromDto(customer)),
          );
          this.updateActiveWorkPageState({ busy: false, error: '', empty: false });
        },
        error: () => {
          const errorMessage = 'Kunden konnten nicht geladen werden. Bitte versuche es erneut.';

          this.clearCustomerSearchBusyTimer();
          this.customerSearchResults.set([]);
          this.customerSearchError.set(errorMessage);
          this.updateActiveWorkPageState({ busy: false, error: errorMessage, empty: false });
        },
        complete: () => this.customerSearchBusy.set(false),
      });
  }

  protected updateDogSearchTerm(searchTerm: string): void {
    this.dogSearchTerm.set(searchTerm);
    const trimmedSearchTerm = searchTerm.trim();

    if (!trimmedSearchTerm) {
      this.dogSearchResults.set([]);
      this.dogSearchError.set('');
      this.dogSearchBusy.set(false);
      this.updateActiveWorkPageState({ busy: false, error: '', empty: false });
      return;
    }

    this.dogSearchBusy.set(true);
    this.dogSearchError.set('');
    this.updateActiveWorkPageState({ busy: true, error: '', empty: false });
    this.http
      .get<PetDto[]>(`${runtimeConfig.apiBaseUrl}/dogs`, {
        params: { limit: String(this.dogListFetchLimit) },
      })
      .subscribe({
        next: (pets) => {
          const normalizedSearchTerm = trimmedSearchTerm.toLocaleLowerCase('de-DE');
          this.dogSearchResults.set(
            pets
              .map((pet) => this.dogInstanceFromDto(pet))
              .filter((dog) => this.dogMatchesSearchTerm(dog, normalizedSearchTerm)),
          );
          this.updateActiveWorkPageState({ busy: false, error: '', empty: false });
        },
        error: () => {
          const errorMessage = 'Hunde konnten nicht geladen werden. Bitte versuche es erneut.';

          this.dogSearchResults.set([]);
          this.dogSearchError.set(errorMessage);
          this.updateActiveWorkPageState({ busy: false, error: errorMessage, empty: false });
        },
        complete: () => this.dogSearchBusy.set(false),
      });
  }

  private loadDogList(): void {
    if (!this.canManageCustomers() || this.dogListBusy()) {
      return;
    }

    this.dogListBusy.set(true);
    this.dogListError.set('');
    this.updateActiveWorkPageState({ busy: true, error: '', empty: false });
    this.http
      .get<PetDto[]>(`${runtimeConfig.apiBaseUrl}/dogs`, {
        params: { limit: String(this.dogListFetchLimit) },
      })
      .subscribe({
        next: (pets) => {
          this.dogListItems.set(pets.map((pet) => this.dogInstanceFromDto(pet)));
          this.updateActiveWorkPageState({ busy: false, error: '', empty: false });
        },
        error: () => {
          const errorMessage = 'Hundeliste konnte nicht geladen werden. Bitte versuche es erneut.';

          this.dogListItems.set([]);
          this.dogListError.set(errorMessage);
          this.updateActiveWorkPageState({ busy: false, error: errorMessage, empty: false });
        },
        complete: () => this.dogListBusy.set(false),
      });
  }

  private loadCustomerList(): void {
    if (!this.canManageCustomers() || this.customerListBusy()) {
      return;
    }

    this.customerListBusy.set(true);
    this.customerListError.set('');
    this.updateActiveWorkPageState({ busy: true, error: '', empty: false });
    this.http
      .get<CustomerDto[]>(`${runtimeConfig.apiBaseUrl}/customers`, {
        params: { limit: String(this.customerListFetchLimit) },
      })
      .subscribe({
        next: (customers) => {
          this.customerListItems.set(
            customers.map((customer) => this.customerListItemFromDto(customer)),
          );
          this.updateActiveWorkPageState({ busy: false, error: '', empty: false });
        },
        error: () => {
          const errorMessage = 'Kundenliste konnte nicht geladen werden. Bitte versuche es erneut.';

          this.customerListItems.set([]);
          this.customerListError.set(errorMessage);
          this.updateActiveWorkPageState({ busy: false, error: errorMessage, empty: false });
        },
        complete: () => this.customerListBusy.set(false),
      });
  }

  protected returnToCustomerSearch(): void {
    const sourceNodeId = this.activeWorkPage()?.sourceNodeId ?? 'customer-search';
    const sourceNode: WorkspaceGraphNode = {
      id: sourceNodeId,
      label: sourceNodeId === 'customers' ? 'Kunden' : 'Suchen',
      kind: sourceNodeId === 'customers' ? 'domain' : 'action',
    };

    this.activeNodeId.set(this.focusableContextNodeIdForNodeId(sourceNodeId));
    this.openCustomerSearchWorkPage(sourceNode, undefined, false);
    this.focusCustomerSearchField();
    this.workspacePanel.set({
      mode: 'search',
      eyebrow: 'Kundensuche',
      title: 'Zur Kundensuche zurückgekehrt',
      description:
        'Du bist wieder in der Suche. Der zuvor geöffnete Kunde bleibt als Arbeitsknoten angeheftet.',
    });
  }

  protected customerInitials(customer: CustomerListItem): string {
    return `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toLocaleUpperCase(
      'de-DE',
    );
  }

  protected handleWorkPagePrimaryAction(): void {
    if (this.activeWorkPage()?.contentType === 'form') {
      if (this.isDogCreateNodeId(this.activeWorkPage()?.sourceNodeId ?? '')) {
        this.createDog();
        return;
      }

      this.createCustomer();
      return;
    }

    if (this.activeWorkPage()?.contentType === 'delete-confirmation') {
      this.deleteSelectedCustomer();
    }
  }

  protected workPageActions(workPage: WorkspaceWorkPage): CircularWorkPageAction[] {
    const actions: CircularWorkPageAction[] = [
      {
        id: 'close',
        label: workPage.secondaryActionLabel,
        icon: 'pi-times',
        severity: 'contrast',
        closes: true,
      },
    ];

    if (workPage.contentType === 'detail' && this.selectedDog() && workPage.sourceNodeId.startsWith('dog:')) {
      return actions;
    }

    const selectedCustomer = this.selectedCustomer();

    if (workPage.contentType === 'detail' && selectedCustomer) {
      const customer = selectedCustomer;

      if (workPage.sourceNodeId === 'customer-search') {
        actions.push({
          id: 'back-to-search',
          label: 'Zurück zur Suche',
          icon: 'pi-arrow-left',
          severity: 'secondary',
        });
      }

      if (this.canManageCustomers()) {
        actions.push({
          id: 'favorite-toggle',
          label: `${customerDisplayName(customer)}: ${this.favoriteActionLabel(customer)}`,
          icon: this.isFavoriteCustomer(customer) ? 'pi-star-fill' : 'pi-star',
          severity: this.isFavoriteCustomer(customer) ? 'warn' : 'success',
          disabled: this.isFavoriteOperationBusy(customer),
          pressed: this.isFavoriteCustomer(customer),
        });
      }

      if (this.canManageCustomers()) {
        actions.push({
          id: 'add-dog-to-customer',
          label: `${customerDisplayName(customer)}: Hund hinzufügen`,
          icon: 'pi-plus-circle',
          severity: 'success',
        });
      }

      if (this.canDeleteCustomers()) {
        actions.push({
          id: 'delete-customer',
          label: `${customerDisplayName(customer)} löschen, destruktive Aktion mit Bestätigung`,
          icon: 'pi-trash',
          severity: 'danger',
        });
      }

      return actions;
    }

    if (workPage.contentType === 'form' && workPage.primaryActionLabel) {
      const isDogCreatePage = this.isDogCreateNodeId(workPage.sourceNodeId);

      actions.push({
        id: 'primary',
        label: workPage.primaryActionLabel,
        icon: 'pi-check',
        severity: 'primary',
        disabled: workPage.busy || (isDogCreatePage && this.dogFormInvalid()),
      });
    }

    if (workPage.contentType === 'delete-confirmation' && workPage.primaryActionLabel) {
      actions.push({
        id: 'primary',
        label: workPage.primaryActionLabel,
        icon: 'pi-trash',
        severity: 'danger',
        disabled: workPage.busy,
      });
    }

    return actions;
  }

  protected handleWorkPageAction(actionId: string): void {
    if (actionId === 'close') {
      this.cancelActiveWorkPage();
      return;
    }

    if (actionId === 'primary') {
      this.handleWorkPagePrimaryAction();
      return;
    }

    const selectedCustomer = this.selectedCustomer();

    if (actionId === 'favorite-toggle' && selectedCustomer) {
      this.toggleFavoriteCustomer(selectedCustomer);
      return;
    }

    if (actionId === 'add-dog-to-customer' && selectedCustomer) {
      this.openDogCreateWorkPageFromSelectedCustomer(selectedCustomer);
      return;
    }

    if (actionId === 'delete-customer' && selectedCustomer) {
      this.openCustomerDeleteConfirmationPage(
        selectedCustomer,
        this.activeWorkPageSourceNode(),
        undefined,
      );
      return;
    }

    if (actionId === 'back-to-search') {
      this.returnToCustomerSearch();
    }
  }

  protected cancelActiveWorkPage(): void {
    const sourceNodeId = this.activeWorkPage()?.sourceNodeId ?? this.activeNodeId();
    const focusNodeId = this.focusNodeAfterWorkPageClose ?? this.focusableContextNodeIdForNodeId(sourceNodeId);

    this.newCustomerName.set('');
    this.customerSearchTerm.set('');
    this.dogSearchTerm.set('');
    this.dogSearchResults.set([]);
    this.resetDogForm();
    this.activeNodeId.set(focusNodeId);
    this.focusNodeAfterWorkPageClose = focusNodeId;
    this.workspacePanel.set({
      mode: 'overview',
      eyebrow: 'Arbeitsgraph',
      title: 'Work-Page geschlossen',
      description:
        'Die runde Work-Page wurde geschlossen. Der Graph bleibt der zentrale Arbeitskontext.',
    });
  }

  protected clearActiveWorkPage(): void {
    this.activeWorkPage.set(null);
    this.unlockGraphPresentation();
    const nodeId = this.focusNodeAfterWorkPageClose ?? this.activeNodeId();

    this.focusNodeAfterWorkPageClose = null;
    setTimeout(() => this.focusWorkspaceNode(nodeId), 50);
  }

  protected setLayoutMode(mode: WorkspaceLayoutMode): void {
    if (this.graphInteractionLocked()) {
      return;
    }

    this.layoutMode.set(mode);

    if (mode === 'focused-work') {
      this.normalizeFocusedWorkState();
    }
  }

  protected expandEntireGraph(): void {
    if (this.graphInteractionLocked()) {
      return;
    }

    this.expandedNodeIds.set(
      new Set(expandableDashboardGraphNodeIds(this.favoriteCustomers(), this.graphRole(), this.dogContextDogs())),
    );
  }

  protected collapseEntireGraph(): void {
    if (this.graphInteractionLocked()) {
      return;
    }

    this.expandedNodeIds.set(new Set());
  }

  private toggleEntireGraph(): void {
    if (this.graphInteractionLocked()) {
      return;
    }

    if (
      isDashboardGraphFullyExpanded(
        this.favoriteCustomers(),
        this.expandedNodeIds(),
        this.graphRole(),
      )
    ) {
      this.collapseEntireGraph();
      return;
    }

    this.expandEntireGraph();
  }

  private normalizeFocusedWorkState(): void {
    const focusedTopLevelNodeId = this.focusedTopLevelNodeIdForActiveNode();
    this.focusedTopLevelNodeId.set(focusedTopLevelNodeId);

    if (!focusedTopLevelNodeId) {
      this.expandedNodeIds.set(new Set());
      return;
    }

    const nextExpandedNodeIds = new Set<string>([focusedTopLevelNodeId]);
    const customer = this.selectedCustomer();

    if (customer && this.activeNodeAncestorIds().includes(customer.id)) {
      nextExpandedNodeIds.add(customer.id);
    }

    this.expandedNodeIds.set(nextExpandedNodeIds);
  }

  private focusedTopLevelNodeIdForActiveNode(): string | undefined {
    const activeNodeId = this.activeNodeId();

    if (isTopLevelDashboardGraphNode(activeNodeId)) {
      return activeNodeId;
    }

    return this.activeNodeAncestorIds().find((nodeId) => isTopLevelDashboardGraphNode(nodeId));
  }

  private activeNodeAncestorIds(): string[] {
    return this.dashboardGraphAncestorIdsForNode(this.activeNodeId());
  }

  private canBecomeActiveWorkFocus(node: WorkspaceGraphNode): boolean {
    return this.layoutMode() !== 'focused-work' || isDashboardGraphWorkFocusNode(node);
  }

  private focusableContextNodeIdForNodeId(nodeId: string): string {
    const node = this.dashboardGraphNodeById(nodeId);

    if (node && isDashboardGraphWorkFocusNode(node)) {
      return node.id;
    }

    const contextNodeId = this.dashboardGraphAncestorIdsForNode(nodeId)
      .filter((ancestorNodeId) => ancestorNodeId !== 'start')
      .find((ancestorNodeId) => {
        const ancestorNode = this.dashboardGraphNodeById(ancestorNodeId);

        return ancestorNode ? isDashboardGraphWorkFocusNode(ancestorNode) : true;
      });

    return contextNodeId ?? this.activeNodeId();
  }

  private dashboardGraphNodeById(nodeId: string): WorkspaceGraphNode | undefined {
    const expandedNodeIds = new Set(
      expandableDashboardGraphNodeIds(this.favoriteCustomers(), this.graphRole(), this.dogContextDogs()),
    );

    return buildDashboardGraphNodes(
      this.favoriteCustomers(),
      expandedNodeIds,
      this.focusedTopLevelNodeId(),
      this.graphRole(),
      this.dogContextDogs(),
    ).find((node) => node.id === nodeId);
  }

  private dashboardGraphAncestorIdsForNode(nodeId: string): string[] {
    const expandedNodeIds = new Set(
      expandableDashboardGraphNodeIds(this.favoriteCustomers(), this.graphRole(), this.dogContextDogs()),
    );
    const edges = buildDashboardGraphEdges(
      this.favoriteCustomers(),
      expandedNodeIds,
      this.graphRole(),
      this.dogContextDogs(),
    );
    const ancestors: string[] = [];
    let currentNodeId = nodeId;

    for (let i = 0; i < edges.length; i += 1) {
      const parentNodeId = edges.find((edge) => edge.to === currentNodeId)?.from;

      if (!parentNodeId) {
        break;
      }

      ancestors.push(parentNodeId);
      currentNodeId = parentNodeId;
    }

    return ancestors;
  }

  private pruneExpandedNodeIdsForWorkPage(sourceNodeId: string): void {
    const relevantContextNodeIds = new Set(
      this.dashboardGraphAncestorIdsForNode(sourceNodeId).filter((nodeId) => nodeId !== 'start'),
    );

    if (hasDashboardGraphChildren(sourceNodeId, this.favoriteCustomers(), this.graphRole())) {
      relevantContextNodeIds.add(sourceNodeId);
    }

    this.expandedNodeIds.update(
      (current) => new Set(Array.from(current).filter((nodeId) => relevantContextNodeIds.has(nodeId))),
    );
  }

  private lockGraphPresentationForWorkPage(): void {
    if (this.lockedGraphPresentation()) {
      return;
    }

    this.lockedGraphPresentation.set({
      nodes: this.graphNodes(),
      edges: this.graphEdges(),
      activeNodeId: this.activeNodeId(),
      centeredNodeId: this.layoutMode() === 'focused-work' ? this.activeNodeId() : '',
      expandedNodeIds: new Set(this.expandedNodeIds()),
      expandableNodeIds: expandableDashboardGraphNodeIds(
        this.favoriteCustomers(),
        this.graphRole(),
      ),
      lockAnchoredNodesToAutoLayout: this.layoutMode() === 'focused-work',
      showFitToViewControl: this.layoutMode() === 'custom-flex',
    });
  }

  private unlockGraphPresentation(): void {
    this.lockedGraphPresentation.set(null);
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

    if (roles.includes('ROLE_groomer')) {
      return 'Groomer';
    }

    if (roles.includes('ROLE_kunde')) {
      return 'Kund:in';
    }

    if (username.startsWith('admin@')) {
      return 'Admin';
    }

    if (username.startsWith('groomer@')) {
      return 'Groomer';
    }

    if (username.startsWith('kunde@')) {
      return 'Kund:in';
    }

    return 'angemeldete:r Nutzer:in';
  }

  private resolveGraphRole(roles: string[], username: string): DashboardGraphRole {
    if (roles.includes('ROLE_admin')) {
      return 'admin';
    }

    if (roles.includes('ROLE_groomer')) {
      return 'groomer';
    }

    if (roles.includes('ROLE_kunde')) {
      return 'kunde';
    }

    if (username.startsWith('admin@')) {
      return 'admin';
    }

    if (username.startsWith('groomer@')) {
      return 'groomer';
    }

    if (username.startsWith('kunde@')) {
      return 'kunde';
    }

    return 'unknown';
  }

  private toggleExpandedNode(nodeId: string): void {
    this.expandedNodeIds.update((current) => {
      const next = new Set(current);

      if (next.has(nodeId)) {
        next.delete(nodeId);
        dashboardGraphDescendantNodeIds(
          nodeId,
          this.favoriteCustomers(),
          this.graphRole(),
          this.dogContextDogs(),
        ).forEach((descendantNodeId) => next.delete(descendantNodeId));
      } else {
        dashboardGraphSiblingSubtreeNodeIds(
          nodeId,
          this.favoriteCustomers(),
          this.graphRole(),
          this.dogContextDogs(),
        ).forEach((siblingSubtreeNodeId) => next.delete(siblingSubtreeNodeId));
        next.add(nodeId);
      }

      return next;
    });
  }

  private focusTopLevelExpansion(nodeId: string): void {
    this.expandedNodeIds.update((current) => {
      if (current.has(nodeId)) {
        return new Set();
      }

      const next = new Set<string>([nodeId]);
      const activeAncestors = this.activeNodeAncestorIds();

      if (nodeId === 'customer-favorites') {
        this.favoriteCustomers().forEach((customer) => {
          if (current.has(customer.id) || activeAncestors.includes(customer.id)) {
            next.add(customer.id);
          }
        });
      }

      return next;
    });
  }

  private collapseOtherTopLevelSubtrees(nodeId: string): void {
    const staleSubtreeNodeIds = dashboardGraphSiblingSubtreeNodeIds(
      nodeId,
      this.favoriteCustomers(),
      this.graphRole(),
      this.dogContextDogs(),
    );

    if (staleSubtreeNodeIds.length === 0) {
      return;
    }

    this.expandedNodeIds.update((current) => {
      const next = new Set(current);

      staleSubtreeNodeIds.forEach((staleNodeId) => next.delete(staleNodeId));

      return next;
    });
  }

  private expandNode(nodeId: string): void {
    this.expandedNodeIds.update((current) => {
      if (current.has(nodeId)) {
        return current;
      }

      return new Set([...Array.from(current), nodeId]);
    });
  }

  private loadCustomerFavorites(): void {
    if (!this.canManageCustomers()) {
      this.favoriteCustomers.set([]);
      return;
    }

    this.http
      .get<CustomerFavoriteDto[]>(`${runtimeConfig.apiBaseUrl}/customer-favorites`)
      .subscribe({
        next: (favorites) =>
          this.favoriteCustomers.set(
            favorites.map((favorite) => this.customerFavoriteFromDto(favorite)),
          ),
        error: () =>
          this.favoriteStatusMessage.set(
            'Favoriten konnten nicht geladen werden. Die Suche bleibt nutzbar, Anheften kann fehlschlagen.',
          ),
      });
  }

  private pinFavoriteCustomer(customer: CustomerInstance): void {
    this.setFavoriteOperationBusy(customer.id, true);
    this.favoriteStatusMessage.set('');
    this.http
      .post<CustomerFavoriteDto>(
        `${runtimeConfig.apiBaseUrl}/customer-favorites/${customer.id}`,
        {},
      )
      .subscribe({
        next: (favorite) => {
          const pinnedCustomer = { ...customer, ...this.customerFavoriteFromDto(favorite) };

          this.pinFavoriteCustomerLocally(pinnedCustomer);
          this.selectedCustomer.update((selectedCustomer) =>
            selectedCustomer?.id === pinnedCustomer.id
              ? { ...selectedCustomer, ...pinnedCustomer }
              : selectedCustomer,
          );
          this.expandNode('customer-favorites');
          this.focusedTopLevelNodeId.set('customer-favorites');
          this.activeNodeId.set(pinnedCustomer.id);
          this.focusNodeAfterWorkPageClose = pinnedCustomer.id;
          this.favoriteStatusMessage.set(
            `${customerDisplayName(pinnedCustomer)} ist jetzt dein persönlicher Favorit.`,
          );
          this.workspacePanel.set({
            mode: 'selected',
            eyebrow: 'Kundenfavorit',
            title: `${customerDisplayName(pinnedCustomer)} angeheftet`,
            description:
              'Der Favoritenstatus kommt aus deiner persönlichen Favoritenliste und ist nicht global am Kunden gespeichert.',
          });
        },
        error: (error: HttpErrorResponse) => {
          this.handleFavoriteError(error);
          this.setFavoriteOperationBusy(customer.id, false);
        },
        complete: () => this.setFavoriteOperationBusy(customer.id, false),
      });
  }

  private removeFavoriteCustomer(customer: CustomerInstance | null): void {
    if (!customer || !this.canManageCustomers()) {
      return;
    }

    this.setFavoriteOperationBusy(customer.id, true);
    this.favoriteStatusMessage.set('');
    this.http
      .delete<void>(`${runtimeConfig.apiBaseUrl}/customer-favorites/${customer.id}`)
      .subscribe({
        next: () => {
          this.favoriteCustomers.update((customers) =>
            customers.filter((candidate) => candidate.id !== customer.id),
          );
          this.favoriteStatusMessage.set(
            `${customerDisplayName(customer)} wurde aus deinen persönlichen Favoriten entfernt.`,
          );
        },
        error: () => {
          this.favoriteStatusMessage.set(
            'Favorit konnte nicht entfernt werden. Bitte versuche es erneut.',
          );
          this.setFavoriteOperationBusy(customer.id, false);
        },
        complete: () => this.setFavoriteOperationBusy(customer.id, false),
      });
  }

  private pinFavoriteCustomerLocally(customer: CustomerInstance): void {
    this.favoriteCustomers.update((customers) => {
      const withoutDuplicate = customers.filter((candidate) => candidate.id !== customer.id);

      return [customer, ...withoutDuplicate].slice(0, 6);
    });
  }

  private handleFavoriteError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.favoriteStatusMessage.set(
        'Du hast bereits 6 persönliche Favoriten. Entferne erst einen Favoriten, bevor du einen neuen anheftest.',
      );
      return;
    }

    this.favoriteStatusMessage.set(
      'Favorit konnte nicht angeheftet werden. Bitte versuche es erneut.',
    );
  }

  private setFavoriteOperationBusy(customerId: string, busy: boolean): void {
    this.favoriteOperationBusyCustomerIds.update((current) => {
      const next = new Set(current);

      if (busy) {
        next.add(customerId);
      } else {
        next.delete(customerId);
      }

      return next;
    });
  }

  private updateActiveWorkPageState(
    state: Partial<Pick<WorkspaceWorkPage, 'busy' | 'error' | 'empty'>>,
  ): void {
    this.activeWorkPage.update((workPage) => (workPage ? { ...workPage, ...state } : workPage));
  }

  private clearCustomerSearchBusyTimer(): void {
    if (this.customerSearchBusyTimer) {
      clearTimeout(this.customerSearchBusyTimer);
      this.customerSearchBusyTimer = undefined;
    }
  }

  private dogInstanceFromDto(pet: PetDto): DogInstance {
    const dogId = pet.dogId ?? pet.petId ?? pet.id;
    const dogName = this.blankToUndefined(pet.dogName) ?? this.blankToUndefined(pet.name) ?? 'Hund';
    const customerId = pet.customerId ? String(pet.customerId) : this.customerIdFromOwnerSubject(pet.ownerSubject);
    const customerLabel =
      this.blankToUndefined(pet.customerDisplayName) ??
      this.blankToUndefined(pet.customerName) ??
      this.blankToUndefined(pet.ownerDisplayName) ??
      this.customerLabelFromKnownCustomerId(customerId) ??
      (customerId ? `Kund:in #${customerId}` : this.customerLabelFromOwnerSubject(pet.ownerSubject));

    return {
      id: `dog:${dogId}`,
      name: dogName,
      customerId,
      customerLabel,
      breed: this.blankToUndefined(pet.breed),
      size: this.blankToUndefined(pet.size),
      groomingNotes: this.blankToUndefined(pet.groomingNotes),
      avatarUrl: pet.imageBase64 ? `data:image/*;base64,${pet.imageBase64}` : undefined,
    };
  }

  private dogMatchesSearchTerm(dog: DogInstance, normalizedSearchTerm: string): boolean {
    return [dog.name, dog.customerLabel, dog.breed, dog.size]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase('de-DE').includes(normalizedSearchTerm));
  }

  private customerIdFromOwnerSubject(ownerSubject: string | null | undefined): string | undefined {
    const match = (ownerSubject ?? '').match(/^customer:(\d+)$/);

    return match?.[1];
  }

  private customerLabelFromKnownCustomerId(customerId: string | undefined): string | undefined {
    const customer = this.favoriteCustomers().find((candidate) => candidate.id === customerId);

    return customer ? customerDisplayName(customer) : undefined;
  }

  private customerLabelFromOwnerSubject(ownerSubject: string | null | undefined): string {
    const subject = this.blankToUndefined(ownerSubject);

    if (!subject) {
      return 'Kundenbezug nicht hinterlegt';
    }

    return subject.startsWith('customer:') ? `Kund:in #${subject.slice('customer:'.length)}` : `Kund:in ${subject}`;
  }

  private pinDogContextLocally(dog: DogInstance): void {
    this.dogContextDogs.update((dogs) => {
      const withoutDuplicate = dogs.filter((candidate) => candidate.id !== dog.id);

      return [dog, ...withoutDuplicate].slice(0, 6);
    });
  }

  private customerListItemFromDto(customer: CustomerDto): CustomerListItem {
    const customerInstance = this.customerInstanceFromDto(customer);

    return {
      ...customerInstance,
      name: customerDisplayName(customerInstance),
      meta: customerInstance.meta ?? 'Kontaktprofil',
      status: customerInstance.status ?? 'Kund:in',
      note: customerInstance.note,
    };
  }

  private customerInstanceFromDto(customer: CustomerDto): CustomerInstance {
    const { firstName, lastName } = this.customerNameParts(customer);

    return {
      id: String(customer.id),
      firstName,
      lastName,
      email: this.blankToUndefined(customer.email),
      phone: this.blankToUndefined(customer.phone),
      meta: this.blankToUndefined(customer.communicationNotes) ?? 'Kontaktprofil',
      status: 'Kund:in',
      note: this.blankToUndefined(customer.communicationNotes),
      avatarUrl: customer.profileImageBase64
        ? `data:image/*;base64,${customer.profileImageBase64}`
        : undefined,
    };
  }

  private customerNameParts(customer: CustomerDto | CustomerFavoriteDto): {
    firstName: string;
    lastName: string;
  } {
    const explicitFirstName = this.blankToUndefined(customer.firstName);
    const explicitLastName = this.blankToUndefined(customer.lastName);

    if (explicitFirstName || explicitLastName) {
      return { firstName: explicitFirstName ?? '', lastName: explicitLastName ?? '' };
    }

    const displayName = this.blankToUndefined(customer.displayName) ?? 'Kunde';
    const [firstName, ...lastNameParts] = displayName.split(/\s+/);

    return { firstName: firstName || 'Kunde', lastName: lastNameParts.join(' ') };
  }

  private blankToUndefined(value: string | null | undefined): string | undefined {
    const trimmedValue = value?.trim();

    return trimmedValue ? trimmedValue : undefined;
  }

  private emptyPetForm(customer?: CustomerInstance): PetFormState {
    return {
      name: '',
      breed: '',
      size: '',
      groomingNotes: '',
      imageBase64: '',
      imageFileName: '',
      customerId: customer?.id ?? '',
    };
  }

  private resetDogForm(customer?: CustomerInstance): void {
    this.dogForm.set(this.emptyPetForm(customer));
    this.dogSelectedCustomer.set(customer ?? null);
    this.dogCustomerSearchTerm.set(customer ? customerDisplayName(customer) : '');
    this.dogCustomerSearchResults.set([]);
    this.dogCustomerSearchError.set('');
    this.dogCustomerSearchBusy.set(false);
    this.dogImageError.set('');
    this.dogCreateError.set('');
  }

  private customerFavoriteFromDto(favorite: CustomerFavoriteDto): CustomerInstance {
    const { firstName, lastName } = this.customerNameParts(favorite);

    return {
      id: String(favorite.customerId),
      firstName,
      lastName,
      email: this.blankToUndefined(favorite.email),
      phone: this.blankToUndefined(favorite.phone),
      meta: this.blankToUndefined(favorite.communicationNotes),
      status: 'Kund:in',
      note: this.blankToUndefined(favorite.communicationNotes),
      avatarUrl: favorite.profileImageBase64
        ? `data:image/*;base64,${favorite.profileImageBase64}`
        : undefined,
    };
  }

  private customerInstanceFromCustomer(
    customer: CustomerInstance | CustomerListItem,
  ): CustomerInstance {
    return {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      meta: customer.meta,
      status: customer.status,
      note: customer.note,
      avatarUrl: customer.avatarUrl,
    };
  }

  private dogFromNode(node: WorkspaceGraphNode): DogInstance | null {
    if (this.isDogInstance(node.payload)) {
      return node.payload;
    }

    return this.dogContextDogs().find((dog) => dog.id === node.id) ?? null;
  }

  private isDogInstance(value: unknown): value is DogInstance {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'name' in value &&
      'customerLabel' in value &&
      typeof value.id === 'string' &&
      typeof value.name === 'string' &&
      typeof value.customerLabel === 'string'
    );
  }

  private customerFromNode(node: WorkspaceGraphNode): CustomerInstance | null {
    if (this.isCustomerInstance(node.payload)) {
      return node.payload;
    }

    return this.favoriteCustomers().find((customer) => customer.id === node.id) ?? null;
  }

  private isCustomerInstance(value: unknown): value is CustomerInstance {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'firstName' in value &&
      'lastName' in value &&
      typeof value.id === 'string' &&
      typeof value.firstName === 'string' &&
      typeof value.lastName === 'string'
    );
  }

  private openCustomerCreateWorkPage(
    node: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
  ): void {
    this.pruneExpandedNodeIdsForWorkPage(node.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(node.id);
    this.activeWorkPage.set({
      sourceNodeId: node.id,
      sourceLabel: node.label,
      sourceOrigin,
      contentType: 'form',
      title: 'Kunden hinzufügen',
      description:
        'Lege einen ersten Kundenknoten an. Der Inhalt ist austauschbar, die runde Shell bleibt wiederverwendbar.',
      originLabel: `aus Knoten ${node.label}`,
      primaryActionLabel: 'Speichern',
      secondaryActionLabel: 'Abbrechen',
    });
  }

  private openDogCreateWorkPageFromSelectedCustomer(customer: CustomerInstance): void {
    const sourceNode = this.dashboardGraphNodeById(`${customer.id}-dog-add`) ?? this.activeWorkPageSourceNode();

    this.openDogCreateWorkPage(sourceNode, undefined, customer);
    this.workspacePanel.set({
      mode: 'dog-create',
      eyebrow: 'Hundeaktion',
      title: 'Hund hinzufügen',
      description: `${customerDisplayName(customer)} ist als Kund:in vorbelegt. Das Formular bleibt dieselbe runde Hund-Erfassung.`,
      node: sourceNode,
    });
  }

  private openDogCreateWorkPage(
    node: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
    customer?: CustomerInstance,
  ): void {
    if (!this.canManageCustomers()) {
      return;
    }

    this.resetDogForm(customer);
    this.pruneExpandedNodeIdsForWorkPage(node.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(node.id);
    this.activeWorkPage.set({
      sourceNodeId: node.id,
      sourceLabel: node.label,
      sourceOrigin,
      contentType: 'form',
      title: 'Hund hinzufügen',
      description:
        'Erfasse die Hund-Felder aus der bestehenden pets-Struktur: Name, Rasse, Größe, Grooming-Notizen und optional ein Profilbild.',
      originLabel: customer
        ? `für ${customerDisplayName(customer)}`
        : 'aus Knoten Hunde, Kund:in noch auswählen',
      primaryActionLabel: 'Hund speichern',
      secondaryActionLabel: 'Abbrechen',
      busy: false,
      error: '',
    });
  }

  private openDogListWorkPage(
    node: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
  ): void {
    if (!this.canManageCustomers()) {
      return;
    }

    this.dogListItems.set([]);
    this.dogListError.set('');
    this.pruneExpandedNodeIdsForWorkPage(node.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(node.id);
    this.activeWorkPage.set({
      sourceNodeId: node.id,
      sourceLabel: node.label,
      sourceOrigin,
      contentType: 'list',
      title: 'Hundeliste',
      description: 'Übersicht der erlaubten Hunde mit sichtbarem Kundenbezug.',
      originLabel: `aus Knoten ${node.label}`,
      primaryActionLabel: '',
      secondaryActionLabel: 'Schließen',
      busy: true,
      error: '',
      empty: false,
    });
    this.loadDogList();
  }

  private openDogSearchWorkPage(
    node: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
  ): void {
    if (!this.canManageCustomers()) {
      return;
    }

    this.dogSearchTerm.set('');
    this.dogSearchResults.set([]);
    this.dogSearchError.set('');
    this.dogSearchBusy.set(false);
    this.pruneExpandedNodeIdsForWorkPage(node.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(node.id);
    this.activeWorkPage.set({
      sourceNodeId: node.id,
      sourceLabel: node.label,
      sourceOrigin,
      contentType: 'search',
      title: 'Hundesuche',
      description: 'Finde Hunde über Name oder Kundenbezug und öffne daraus einen Hund-Kontext.',
      originLabel: `aus Knoten ${node.label}`,
      primaryActionLabel: '',
      secondaryActionLabel: 'Schließen',
      empty: false,
    });
  }

  private openCustomerListWorkPage(
    node: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
  ): void {
    if (!this.canManageCustomers()) {
      return;
    }

    this.customerListItems.set([]);
    this.customerListError.set('');
    this.pruneExpandedNodeIdsForWorkPage(node.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(node.id);
    this.activeWorkPage.set({
      sourceNodeId: node.id,
      sourceLabel: node.label,
      sourceOrigin,
      contentType: 'list',
      title: 'Kundenliste',
      description:
        'Tabellarische Übersicht der Kund:innen mit 30 Einträgen pro Seite. Leere Kontaktfelder werden verständlich gekennzeichnet.',
      originLabel: `aus Knoten ${node.label}`,
      primaryActionLabel: '',
      secondaryActionLabel: 'Schließen',
      busy: true,
      error: '',
      empty: false,
    });
    this.loadCustomerList();
  }

  private openCustomerSearchWorkPage(
    node: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
    resetSearchTerm = true,
  ): void {
    if (!this.canManageCustomers()) {
      return;
    }

    if (resetSearchTerm) {
      this.customerSearchTerm.set('');
      this.customerSearchResults.set([]);
      this.customerSearchError.set('');
      this.customerSearchBusy.set(false);
    }
    this.pruneExpandedNodeIdsForWorkPage(node.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(node.id);
    this.activeWorkPage.set({
      sourceNodeId: node.id,
      sourceLabel: node.label,
      sourceOrigin,
      contentType: 'search',
      title: 'Kundensuche',
      description: 'Finde Kund:innen über Vor- oder Nachname und hefte sie als Arbeitsknoten an.',
      originLabel: `aus Knoten ${node.label}`,
      primaryActionLabel: '',
      secondaryActionLabel: 'Schließen',
      empty: false,
    });
  }

  private openDogDetailWorkPage(
    dog: DogInstance,
    sourceNode: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
  ): void {
    this.selectedDog.set(dog);
    this.pruneExpandedNodeIdsForWorkPage(sourceNode.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = dog.id;
    this.activeWorkPage.set({
      sourceNodeId: sourceNode.id,
      sourceLabel: sourceNode.label,
      sourceOrigin,
      contentType: 'detail',
      title: `${dog.name} Details`,
      originLabel: `aus Knoten ${sourceNode.label}`,
      primaryActionLabel: '',
      secondaryActionLabel: 'Zum Hund-Knoten',
    });
  }

  private openCustomerProfileReadPage(
    customer: CustomerInstance,
    sourceNode: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
    secondaryActionLabel: string,
  ): void {
    this.selectedDog.set(null);
    this.pruneExpandedNodeIdsForWorkPage(sourceNode.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = customer.id;
    this.activeWorkPage.set({
      sourceNodeId: sourceNode.id,
      sourceLabel: sourceNode.label,
      sourceOrigin,
      contentType: 'detail',
      title: `${customerDisplayName(customer)} Profil`,
      originLabel: `aus Knoten ${sourceNode.label}`,
      primaryActionLabel: '',
      secondaryActionLabel,
    });
    this.focusCustomerProfileRegion();
  }

  protected openCustomerDeleteConfirmationPage(
    customer: CustomerInstance,
    sourceNode: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
  ): void {
    this.pruneExpandedNodeIdsForWorkPage(sourceNode.id);
    this.lockGraphPresentationForWorkPage();
    this.customerDeleteBusy.set(false);
    this.customerDeleteError.set('');
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(sourceNode.id);
    this.activeWorkPage.set({
      sourceNodeId: sourceNode.id,
      sourceLabel: sourceNode.label,
      sourceOrigin,
      contentType: 'delete-confirmation',
      title: `${customerDisplayName(customer)} löschen`,
      description: `Diese Aktion ist destruktiv und entfernt ${customerDisplayName(customer)} aus Kundenliste, Suche, Detailansicht und Favoritenanzeige.`,
      originLabel: `aus Knoten ${sourceNode.label}`,
      primaryActionLabel: 'Endgültig löschen',
      secondaryActionLabel: 'Abbrechen',
      busy: false,
      error: '',
    });
  }

  protected activeWorkPageSourceNode(): WorkspaceGraphNode {
    const activeWorkPage = this.activeWorkPage();

    return {
      id: activeWorkPage?.sourceNodeId ?? 'customer-search',
      label: activeWorkPage?.sourceLabel ?? 'Suchen',
      kind: activeWorkPage?.sourceNodeId === 'customers' ? 'domain' : 'action',
    };
  }

  private focusCustomerSearchField(): void {
    setTimeout(() =>
      this.hostElement.nativeElement.querySelector<HTMLElement>('#workPageCustomerSearch')?.focus(),
    );
  }

  private focusCustomerProfileRegion(): void {
    setTimeout(() =>
      this.hostElement.nativeElement
        .querySelector<HTMLElement>('#customerProfileReadMode')
        ?.focus(),
    );
  }

  private openDailyAgendaWorkPage(
    node: WorkspaceGraphNode,
    sourceOrigin: CircularWorkPageOrigin | undefined,
  ): void {
    this.pruneExpandedNodeIdsForWorkPage(node.id);
    this.lockGraphPresentationForWorkPage();
    this.focusNodeAfterWorkPageClose = this.focusableContextNodeIdForNodeId(node.id);
    this.activeWorkPage.set({
      sourceNodeId: node.id,
      sourceLabel: node.label,
      sourceOrigin,
      contentType: 'calendar',
      title: 'Tagesplanung',
      description:
        'Überblick über die heutigen Termine als scrollbare Agenda. Noch ohne echte Kalenderlogik.',
      originLabel: 'aus Knoten Kalender',
      primaryActionLabel: '',
      secondaryActionLabel: 'Schließen',
      empty: this.dailyAgendaItems.length === 0,
    });
  }

  private panelEyebrow(node: WorkspaceGraphNode): string {
    if (node.kind === 'domain') {
      return 'Domäne';
    }

    if (node.kind === 'page') {
      return 'Seitenkontext';
    }

    if (node.kind === 'action') {
      return 'Aktion';
    }

    return 'Arbeitsgraph';
  }

  private isDogCreateNodeId(nodeId: string): boolean {
    return nodeId === 'dog-add' || nodeId.endsWith('-dog-add');
  }

  protected canManageCustomers(): boolean {
    const role = this.graphRole();

    return role === 'admin' || role === 'groomer';
  }

  protected canDeleteCustomers(): boolean {
    return this.graphRole() === 'admin';
  }

  private removeDeletedCustomerLocally(customer: CustomerInstance): void {
    this.favoriteCustomers.update((customers) =>
      customers.filter((candidate) => candidate.id !== customer.id),
    );
    this.customerSearchResults.update((customers) =>
      customers.filter((candidate) => candidate.id !== customer.id),
    );
    this.selectedCustomer.update((selectedCustomer) =>
      selectedCustomer?.id === customer.id ? null : selectedCustomer,
    );
    this.expandedNodeIds.update((current) => {
      const next = new Set(current);

      next.delete(customer.id);
      return next;
    });
  }

  private customerDeleteErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return 'Nicht erlaubt: Nur Admins dürfen Kund:innen löschen.';
    }

    if (error.status === 404) {
      return 'Kund:in wurde nicht gefunden oder ist bereits gelöscht.';
    }

    if (error.status === 409) {
      return 'Kund:in kann wegen bestehender Verknüpfungen noch nicht gelöscht werden.';
    }

    return 'Kund:in konnte nicht gelöscht werden. Bitte versuche es erneut.';
  }

  private focusWorkspaceNode(nodeId: string): void {
    this.workspaceGraphElement?.nativeElement
      .querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`)
      ?.focus();
  }
}

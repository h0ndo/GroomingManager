import { WorkspaceGraphEdge, WorkspaceGraphNode } from '../../shared/workspace-graph/workspace-graph';

export type DashboardGraphRole = 'admin' | 'groomer' | 'kunde' | 'unknown';

export type CustomerInstance = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  meta?: string;
  status?: string;
  note?: string;
  name?: string;
};

const TOP_LEVEL_NODE_IDS = ['groomers', 'calendar', 'admin', 'customers', 'dogs'] as const;
const CUSTOMER_FAVORITES_NODE_ID = 'customer-favorites';
const CUSTOMER_FAVORITE_LIMIT = 6;
const CUSTOMER_FAVORITE_NODE_DISTANCE = 190;
const CUSTOMER_LABEL_LINE_MAX_LENGTH = 13;

type TopLevelNodeId = (typeof TOP_LEVEL_NODE_IDS)[number];

const TOP_LEVEL_BASE_ANGLES = new Map<TopLevelNodeId, number>([
  ['groomers', 0],
  ['calendar', 72],
  ['admin', 144],
  ['customers', 216],
  ['dogs', 288],
]);

const rootNode: WorkspaceGraphNode = {
  id: 'start',
  label: 'Start Schnittstelle 2',
  kind: 'root',
  x: 520,
  y: 330,
  icon: 'pi-home',
  logoUrl: '/s2.png',
  rootNodeSize: '7.5rem',
  action: 'open-panel',
  description: 'Dashboard und zentraler Arbeitsbereich von Schnittstelle 2',
};

const topLevelNodes: WorkspaceGraphNode[] = [
  {
    id: 'groomers',
    label: 'Groomer',
    kind: 'domain',
    x: 705,
    y: 330,
    layout: { angle: 0 },
    icon: 'pi-sparkles',
    action: 'open-panel',
    description: 'Groomer und Teamplanung',
  },
  {
    id: 'calendar',
    label: 'Kalender',
    kind: 'domain',
    x: 575,
    y: 155,
    layout: { angle: 72 },
    icon: 'pi-calendar',
    action: 'open-panel',
    description: 'Kalender- und Kapazitätsübersicht',
  },
  {
    id: 'admin',
    label: 'Admin',
    kind: 'domain',
    x: 330,
    y: 225,
    layout: { angle: 144 },
    icon: 'pi-shield',
    action: 'open-panel',
    description: 'Administration, Nutzerverwaltung und Einstellungen',
  },
  {
    id: 'customers',
    label: 'Kunden',
    kind: 'domain',
    x: 330,
    y: 435,
    layout: { angle: 216 },
    icon: 'pi-users',
    action: 'open-panel',
    description: 'Kundenbereich mit rollenabhängiger Suche, Favoriten und konkreten Kundenknoten',
  },
  {
    id: 'dogs',
    label: 'Hunde',
    kind: 'domain',
    x: 575,
    y: 505,
    layout: { angle: 288 },
    icon: 'pi-heart',
    action: 'open-panel',
    description: 'Tierprofile, Pflegehinweise und Dokumentation',
  },
];

const childrenByParent = new Map<string, WorkspaceGraphNode[]>([
  [
    'admin',
    [
      {
        id: 'admin-groomer-add',
        label: 'Groomer hinzufügen',
        kind: 'action',
        x: 200,
        y: 260,
        icon: 'pi-user-plus',
        action: 'custom',
        description: 'Neuen Groomer im Admin-Kontext anlegen',
      },
      {
        id: 'admin-groomer-remove',
        label: 'Groomer entfernen',
        kind: 'action',
        x: 200,
        y: 395,
        icon: 'pi-user-minus',
        action: 'custom',
        description: 'Groomer-Zugriff oder Groomer-Profil entfernen',
      },
      {
        id: 'admin-settings',
        label: 'Einstellungen',
        kind: 'action',
        x: 360,
        y: 500,
        icon: 'pi-cog',
        action: 'custom',
        description: 'System- und Salon-Einstellungen bearbeiten',
      },
    ],
  ],
  [
    'groomers',
    [
      {
        id: 'groomer-appointment-list',
        label: 'Terminliste',
        kind: 'page',
        x: 820,
        y: 245,
        layout: { angle: 330 },
        icon: 'pi-list-check',
        action: 'open-panel',
        description: 'Terminliste für Groomer',
      },
      {
        id: 'groomer-revenue',
        label: 'Umsatz',
        kind: 'page',
        x: 830,
        y: 415,
        layout: { angle: 30 },
        icon: 'pi-chart-line',
        action: 'open-panel',
        description: 'Umsatzübersicht für Groomer',
      },
    ],
  ],
  [
    'calendar',
    [
      {
        id: 'appointments',
        label: 'Tagesplanung',
        kind: 'page',
        x: 675,
        y: 65,
        layout: { angle: 72, distance: 155 },
        icon: 'pi-clock',
        action: 'open-panel',
        description: 'Termine, Buchungen und Anfragen',
      },
    ],
  ],
]);

const customerManagerNodes: WorkspaceGraphNode[] = [
  {
    id: 'customer-search',
    label: 'Suchen',
    kind: 'action',
    x: 135,
    y: 95,
    layout: { angle: 170 },
    icon: 'pi-search',
    action: 'custom',
    description: 'Kunden suchen und als Arbeitsknoten anheften. Sichtbar für Admins und Groomer.',
  },
  {
    id: 'customer-add',
    label: 'Hinzufügen',
    kind: 'action',
    x: 135,
    y: 250,
    layout: { angle: 215 },
    icon: 'pi-plus',
    action: 'custom',
    description: 'Neuen Kunden über ein Formular erfassen. Sichtbar für Admins und Groomer.',
  },
  {
    id: CUSTOMER_FAVORITES_NODE_ID,
    label: 'Favoriten',
    kind: 'page',
    x: 230,
    y: 345,
    layout: { angle: 260 },
    icon: 'pi-star',
    action: 'open-panel',
    description: `Bis zu ${CUSTOMER_FAVORITE_LIMIT} angeheftete Kunden-Instanzen für schnellen Zugriff. Sichtbar für Admins und Groomer.`,
  },
];

const customerSelfServiceNodes: WorkspaceGraphNode[] = [
  {
    id: 'customer-self-profile',
    label: 'Mein Profil',
    kind: 'page',
    x: 230,
    y: 345,
    layout: { angle: 216 },
    icon: 'pi-id-card',
    action: 'open-panel',
    description: 'Eigener Kundenbereich ohne Groomer-/Admin-Suche und ohne Favoritenverwaltung.',
  },
];

export function customerDisplayName(customer: CustomerInstance): string {
  const structuredName = `${customer.firstName} ${customer.lastName}`.trim();

  return structuredName || customer.name || 'Kunde';
}

function customerChildNodes(role: DashboardGraphRole): WorkspaceGraphNode[] {
  return canManageCustomerGraph(role) ? customerManagerNodes : customerSelfServiceNodes;
}

function favoriteCustomers(customers: readonly CustomerInstance[]): CustomerInstance[] {
  return customers.slice(0, CUSTOMER_FAVORITE_LIMIT);
}

function customerLabelLines(customer: CustomerInstance): string[] {
  const nameParts = [customer.firstName, customer.lastName]
    .map((namePart) => namePart.trim())
    .filter(Boolean);

  if (nameParts.length > 0) {
    return nameParts.map((namePart) => truncateLabelLine(namePart));
  }

  return [truncateLabelLine(customer.name?.trim() || 'Kunde')];
}

function truncateLabelLine(labelLine: string): string {
  if (labelLine.length <= CUSTOMER_LABEL_LINE_MAX_LENGTH) {
    return labelLine;
  }

  return `${labelLine.slice(0, CUSTOMER_LABEL_LINE_MAX_LENGTH - 1)}…`;
}

function customerInstanceNode(customer: CustomerInstance): WorkspaceGraphNode {
  return {
    id: customer.id,
    label: customerDisplayName(customer),
    labelLines: customerLabelLines(customer),
    kind: 'instance',
    x: 170,
    y: 410,
    layout: { distance: CUSTOMER_FAVORITE_NODE_DISTANCE },
    icon: 'pi-user',
    avatarUrl: customer.avatarUrl,
    action: 'custom',
    payload: customer,
    description: 'Angehefteter konkreter Kunde mit Vorname, Nachname und optionalem Profilbild im Arbeitsgraphen',
  };
}

function customerActionNodes(customer: CustomerInstance): WorkspaceGraphNode[] {
  return [
    {
      id: `${customer.id}-profile`,
      label: 'Profil',
      kind: 'action',
      x: 155,
      y: 550,
      icon: 'pi-id-card',
      action: 'custom',
      payload: customer,
      description: 'Profil dieses Kunden im Lesemodus ansehen',
    },
    {
      id: `${customer.id}-appointment-list`,
      label: 'Terminliste',
      kind: 'page',
      x: 355,
      y: 440,
      icon: 'pi-list-check',
      action: 'open-panel',
      payload: customer,
      description: 'Terminliste dieses konkreten Kunden',
    },
    {
      id: `${customer.id}-delete`,
      label: 'Löschen',
      kind: 'action',
      x: 305,
      y: 565,
      icon: 'pi-trash',
      action: 'custom',
      payload: customer,
      description: 'Diesen Kunden löschen',
    },
    {
      id: `${customer.id}-detach`,
      label: 'X',
      kind: 'action',
      x: 125,
      y: 285,
      icon: 'pi-times',
      action: 'remove-instance',
      payload: customer,
      description: 'Kundenknoten aus dem Arbeitsgraphen lösen',
    },
  ];
}

function canManageCustomerGraph(role: DashboardGraphRole): boolean {
  return role === 'admin' || role === 'groomer';
}

function topLevelLayoutById(focusedTopLevelNodeId?: string): Map<string, number> {
  const focusedAngle = isTopLevelNodeId(focusedTopLevelNodeId) ? (TOP_LEVEL_BASE_ANGLES.get(focusedTopLevelNodeId) ?? 0) : 0;

  return new Map(
    TOP_LEVEL_NODE_IDS.map((nodeId) => [nodeId, normalizeAngle((TOP_LEVEL_BASE_ANGLES.get(nodeId) ?? 0) - focusedAngle)]),
  );
}

function withTopLevelLayout(node: WorkspaceGraphNode, topLevelLayout: Map<string, number>): WorkspaceGraphNode {
  return {
    ...node,
    layout: {
      ...node.layout,
      angle: topLevelLayout.get(node.id) ?? node.layout?.angle,
    },
  };
}

function withChildLayout(
  parentNodeId: TopLevelNodeId,
  node: WorkspaceGraphNode,
  topLevelLayout: Map<string, number>,
): WorkspaceGraphNode {
  const parentBaseAngle = TOP_LEVEL_BASE_ANGLES.get(parentNodeId) ?? 0;
  const parentLayoutAngle = topLevelLayout.get(parentNodeId) ?? parentBaseAngle;
  const baseChildAngle = node.layout?.angle;

  if (baseChildAngle === undefined) {
    return node;
  }

  return {
    ...node,
    layout: {
      ...node.layout,
      angle: normalizeAngle(parentLayoutAngle + baseChildAngle - parentBaseAngle),
    },
  };
}

function isTopLevelNodeId(nodeId: string | undefined): nodeId is TopLevelNodeId {
  return TOP_LEVEL_NODE_IDS.some((topLevelNodeId) => topLevelNodeId === nodeId);
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function customerByNodeId(nodeId: string, customers: readonly CustomerInstance[]): CustomerInstance | undefined {
  return customers.find((customer) => customer.id === nodeId);
}

export function isTopLevelDashboardGraphNode(nodeId: string): boolean {
  return isTopLevelNodeId(nodeId);
}

export function isFunctionalDashboardGraphNode(node: WorkspaceGraphNode): boolean {
  if (node.id === 'start' || isTopLevelNodeId(node.id)) {
    return false;
  }

  return !!node.route || !!node.action || node.kind === 'page' || node.kind === 'action' || node.kind === 'instance';
}

export function expandableDashboardGraphNodeIds(
  customers: readonly CustomerInstance[],
  role: DashboardGraphRole = 'admin',
): string[] {
  if (!canManageCustomerGraph(role)) {
    return [...TOP_LEVEL_NODE_IDS];
  }

  return [...TOP_LEVEL_NODE_IDS, CUSTOMER_FAVORITES_NODE_ID, ...favoriteCustomers(customers).map((customer) => customer.id)];
}

export function isDashboardGraphFullyExpanded(
  customers: readonly CustomerInstance[],
  expandedNodeIds: ReadonlySet<string>,
  role: DashboardGraphRole = 'admin',
): boolean {
  return expandableDashboardGraphNodeIds(customers, role).every((nodeId) => expandedNodeIds.has(nodeId));
}

export function buildDashboardGraphNodes(
  customers: readonly CustomerInstance[],
  expandedNodeIds: ReadonlySet<string>,
  focusedTopLevelNodeId?: string,
  role: DashboardGraphRole = 'admin',
): WorkspaceGraphNode[] {
  const topLevelLayout = topLevelLayoutById(focusedTopLevelNodeId);
  const nodes = [rootNode, ...topLevelNodes.map((node) => withTopLevelLayout(node, topLevelLayout))];
  const visibleFavoriteCustomers = favoriteCustomers(customers);

  TOP_LEVEL_NODE_IDS.forEach((nodeId) => {
    if (expandedNodeIds.has(nodeId)) {
      const childNodes = nodeId === 'customers' ? customerChildNodes(role) : (childrenByParent.get(nodeId) ?? []);

      nodes.push(...childNodes.map((node) => withChildLayout(nodeId, node, topLevelLayout)));
    }
  });

  if (canManageCustomerGraph(role) && expandedNodeIds.has(CUSTOMER_FAVORITES_NODE_ID)) {
    nodes.push(...visibleFavoriteCustomers.map((customer) => customerInstanceNode(customer)));
  }

  visibleFavoriteCustomers.forEach((customer) => {
    if (expandedNodeIds.has(customer.id)) {
      nodes.push(...customerActionNodes(customer));
    }
  });

  return nodes;
}

export function buildDashboardGraphEdges(
  customers: readonly CustomerInstance[],
  expandedNodeIds: ReadonlySet<string>,
  role: DashboardGraphRole = 'admin',
): WorkspaceGraphEdge[] {
  const edges: WorkspaceGraphEdge[] = [
    { from: 'start', to: 'groomers' },
    { from: 'start', to: 'calendar' },
    { from: 'start', to: 'admin' },
    { from: 'start', to: 'customers' },
    { from: 'start', to: 'dogs' },
  ];
  const visibleFavoriteCustomers = favoriteCustomers(customers);

  TOP_LEVEL_NODE_IDS.forEach((nodeId) => {
    if (expandedNodeIds.has(nodeId)) {
      const childNodes = nodeId === 'customers' ? customerChildNodes(role) : (childrenByParent.get(nodeId) ?? []);

      edges.push(...childNodes.map((node) => ({ from: nodeId, to: node.id })));
    }
  });

  if (canManageCustomerGraph(role) && expandedNodeIds.has(CUSTOMER_FAVORITES_NODE_ID)) {
    edges.push(...visibleFavoriteCustomers.map((customer) => ({ from: CUSTOMER_FAVORITES_NODE_ID, to: customer.id })));
  }

  visibleFavoriteCustomers.forEach((customer) => {
    if (expandedNodeIds.has(customer.id)) {
      edges.push(...customerActionNodes(customer).map((node) => ({ from: customer.id, to: node.id })));
    }
  });

  return edges;
}

export function hasDashboardGraphChildren(
  nodeId: string,
  customers: readonly CustomerInstance[],
  role: DashboardGraphRole = 'admin',
): boolean {
  if (nodeId === 'customers') {
    return true;
  }

  if (nodeId === CUSTOMER_FAVORITES_NODE_ID) {
    return canManageCustomerGraph(role) && favoriteCustomers(customers).length > 0;
  }

  return childrenByParent.has(nodeId) || !!customerByNodeId(nodeId, favoriteCustomers(customers));
}

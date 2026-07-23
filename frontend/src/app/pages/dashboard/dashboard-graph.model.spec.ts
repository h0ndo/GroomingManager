import {
  buildDashboardGraphEdges,
  buildDashboardGraphNodes,
  dashboardGraphDescendantNodeIds,
  dashboardGraphSiblingSubtreeNodeIds,
  expandableDashboardGraphNodeIds,
  hasDashboardGraphChildren,
  isDashboardGraphFullyExpanded,
  isFunctionalDashboardGraphNode,
  type CustomerInstance,
  type DogInstance,
} from './dashboard-graph.model';
import { computeRadialGraphLayout } from '../../shared/workspace-graph/core/radial-graph-layout';

const favoriteCustomers: CustomerInstance[] = [
  {
    id: 'customer-katja-gross',
    firstName: 'Katja',
    lastName: 'Gross',
    avatarUrl: '/avatars/katja.png',
  },
  { id: 'customer-alex-sommer', firstName: 'Alex', lastName: 'Sommer' },
];

const visibleDogs: DogInstance[] = [
  { id: 'dog-wau', name: 'wau', customerLabel: 'Katja Gross' },
  { id: 'dog-kakkkkkk', name: 'kakkkkkk', customerLabel: 'Hans Wuest' },
];

describe('dashboard graph model', () => {
  it('starts with a branded root node and only the top-level domains visible', () => {
    const nodes = buildDashboardGraphNodes([], new Set());
    const edges = buildDashboardGraphEdges([], new Set());
    const startNode = nodes.find((node) => node.id === 'start') as (typeof nodes)[number] & {
      logoUrl?: string;
      rootNodeSize?: string;
    };

    expect(nodes.map((node) => node.id)).toEqual([
      'start',
      'groomers',
      'calendar',
      'admin',
      'customers',
      'customer-favorites',
      'dogs',
    ]);
    expect(startNode.label).toBe('Start Schnittstelle 2');
    expect(startNode.logoUrl).toBe('/s2.png');
    expect(startNode.rootNodeSize).toBe('7.5rem');
    expect(edges).toEqual([
      { from: 'start', to: 'groomers' },
      { from: 'start', to: 'calendar' },
      { from: 'start', to: 'admin' },
      { from: 'start', to: 'customers' },
      { from: 'start', to: 'customer-favorites' },
      { from: 'start', to: 'dogs' },
    ]);
  });

  it('shows customer search/add under customers and favorites as top-level for manager roles', () => {
    const expandedNodeIds = new Set(['calendar', 'customers']);
    const nodes = buildDashboardGraphNodes(
      favoriteCustomers,
      expandedNodeIds,
      undefined,
      'groomer',
    );
    const edges = buildDashboardGraphEdges(favoriteCustomers, expandedNodeIds, 'groomer');

    expect(nodes.map((node) => node.id)).toEqual(
      jasmine.arrayContaining([
        'start',
        'calendar',
        'customers',
        'appointments',
        'customer-search',
        'customer-add',
        'customer-favorites',
      ]),
    );
    expect(nodes.find((node) => node.id === 'customer-favorites')).toEqual(
      jasmine.objectContaining({
        kind: 'domain',
        description:
          'Eigenständiger Schnellzugriff für bis zu 6 persönliche Kunden-Favoriten. Sichtbar für Admins und Groomer.',
      }),
    );
    expect(nodes.find((node) => node.id === 'customer-favorites')).not.toEqual(
      jasmine.objectContaining({ action: jasmine.anything() }),
    );
    expect(nodes.map((node) => node.id)).not.toContain('admin-groomer-add');
    expect(nodes.map((node) => node.id)).not.toContain('groomer-appointment-list');
    expect(edges).toEqual(
      jasmine.arrayContaining([
        { from: 'calendar', to: 'appointments' },
        { from: 'customers', to: 'customer-search' },
        { from: 'customers', to: 'customer-add' },
        { from: 'start', to: 'customer-favorites' },
      ]),
    );
    expect(edges).not.toContain({ from: 'admin', to: 'admin-groomer-add' });
  });

  it('treats the favorites node as an expandable structural node even without favorites', () => {
    const nodes = buildDashboardGraphNodes([], new Set(['customers']), undefined, 'admin');
    const favoritesNode = nodes.find((node) => node.id === 'customer-favorites');

    expect(favoritesNode).toBeDefined();
    expect(hasDashboardGraphChildren('customer-favorites', [], 'admin')).toBeTrue();
    expect(isFunctionalDashboardGraphNode(favoritesNode!)).toBeFalse();
    expect(
      buildDashboardGraphNodes(
        [],
        new Set(['customers', 'customer-favorites']),
        undefined,
        'admin',
      ).map((node) => node.id),
    ).toEqual(jasmine.arrayContaining(['customer-favorites']));
    expect(
      buildDashboardGraphEdges([], new Set(['customers', 'customer-favorites']), 'admin').filter(
        (edge) => edge.from === 'customer-favorites',
      ),
    ).toEqual([]);
  });

  it('hides search and favorites for the customer role and exposes only the own profile area', () => {
    const expandedNodeIds = new Set(['customers']);
    const nodes = buildDashboardGraphNodes(favoriteCustomers, expandedNodeIds, undefined, 'kunde');
    const edges = buildDashboardGraphEdges(favoriteCustomers, expandedNodeIds, 'kunde');

    expect(nodes.map((node) => node.id)).toEqual(
      jasmine.arrayContaining(['customers', 'customer-self-profile']),
    );
    expect(nodes.map((node) => node.id)).not.toContain('customer-search');
    expect(nodes.map((node) => node.id)).not.toContain('customer-favorites');
    expect(edges).toEqual(
      jasmine.arrayContaining([{ from: 'customers', to: 'customer-self-profile' }]),
    );
    expect(edges).not.toContain({ from: 'customers', to: 'customer-search' });
  });

  it('rotates the selected top-level domain to the horizontal right while preserving the top-level order', () => {
    const nodes = buildDashboardGraphNodes([], new Set(), 'calendar');

    expect(nodes.find((node) => node.id === 'calendar')?.layout?.angle).toBe(0);
    expect(nodes.find((node) => node.id === 'admin')?.layout?.angle).toBe(60);
    expect(nodes.find((node) => node.id === 'customers')?.layout?.angle).toBe(120);
    expect(nodes.find((node) => node.id === 'customer-favorites')?.layout?.angle).toBe(180);
    expect(nodes.find((node) => node.id === 'dogs')?.layout?.angle).toBe(240);
    expect(nodes.find((node) => node.id === 'groomers')?.layout?.angle).toBe(300);
  });

  it('adds up to six customer instance nodes below favorites and preserves profile data on the payload', () => {
    const sevenCustomers = Array.from({ length: 7 }, (_, index) => ({
      id: `customer-${index + 1}`,
      firstName: `Vorname${index + 1}`,
      lastName: `Nachname${index + 1}`,
      avatarUrl: `/avatars/${index + 1}.png`,
    }));
    const expandedNodeIds = new Set(['customers', 'customer-favorites']);
    const nodes = buildDashboardGraphNodes(sevenCustomers, expandedNodeIds);
    const edges = buildDashboardGraphEdges(sevenCustomers, expandedNodeIds);

    expect(nodes.filter((node) => node.kind === 'instance').map((node) => node.id)).toEqual([
      'customer-1',
      'customer-2',
      'customer-3',
      'customer-4',
      'customer-5',
      'customer-6',
    ]);
    expect(nodes.map((node) => node.id)).not.toContain('customer-7');
    expect(nodes.find((node) => node.id === 'customer-1')).toEqual(
      jasmine.objectContaining({
        label: 'Vorname1 Nachname1',
        labelLines: ['Vorname1', 'Nachname1'],
        avatarUrl: '/avatars/1.png',
        payload: sevenCustomers[0],
      }),
    );
    expect(
      isFunctionalDashboardGraphNode(nodes.find((node) => node.id === 'customer-1')!),
    ).toBeFalse();
    expect(edges).toEqual(
      jasmine.arrayContaining([{ from: 'customer-favorites', to: 'customer-1' }]),
    );
  });

  it('keeps one to six favorites readable with compact two-line labels and a wider radial distance', () => {
    const sixCustomers = Array.from({ length: 6 }, (_, index) => ({
      id: `customer-${index + 1}`,
      firstName: `SehrlangerVorname${index + 1}`,
      lastName: `SehrlangerNachname${index + 1}`,
    }));
    const nodes = buildDashboardGraphNodes(
      sixCustomers,
      new Set(['customers', 'customer-favorites']),
    );
    const favoriteNodes = nodes.filter((node) => node.kind === 'instance');

    expect(favoriteNodes).toHaveSize(6);
    expect(favoriteNodes.every((node) => node.layout?.distance === 190)).toBeTrue();
    favoriteNodes.forEach((node, index) => {
      expect(node.label).toBe(`SehrlangerVorname${index + 1} SehrlangerNachname${index + 1}`);
      expect(node.labelLines).toEqual(['SehrlangerVo…', 'SehrlangerNa…']);
      expect(node.labelLines?.every((line) => line.length <= 13)).toBeTrue();
    });

    const singleFavoriteNodes = buildDashboardGraphNodes(
      [sixCustomers[0]],
      new Set(['customers', 'customer-favorites']),
    ).filter((node) => node.kind === 'instance');

    expect(singleFavoriteNodes).toHaveSize(1);
    expect(singleFavoriteNodes[0].labelLines).toEqual(['SehrlangerVo…', 'SehrlangerNa…']);
  });

  it('adds customer instance children as third-level work actions with unique per-customer ids', () => {
    const expandedNodeIds = new Set(['customers', 'customer-favorites', 'customer-katja-gross']);
    const nodes = buildDashboardGraphNodes(favoriteCustomers, expandedNodeIds);
    const edges = buildDashboardGraphEdges(favoriteCustomers, expandedNodeIds);

    expect(nodes.map((node) => node.id)).toEqual(
      jasmine.arrayContaining([
        'customer-katja-gross',
        'customer-katja-gross-profile',
        'customer-katja-gross-appointment-list',
        'customer-katja-gross-delete',
        'customer-katja-gross-dog-add',
        'customer-katja-gross-detach',
      ]),
    );
    expect(edges).toEqual(
      jasmine.arrayContaining([
        { from: 'customer-favorites', to: 'customer-katja-gross' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-profile' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-appointment-list' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-delete' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-dog-add' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-detach' },
      ]),
    );
  });

  it('derives recursive descendants from separate customers and favorites top-level areas', () => {
    const staleExpandedNodeIds = new Set(['customer-katja-gross', 'customer-alex-sommer']);

    expect(dashboardGraphDescendantNodeIds('customers', favoriteCustomers)).toEqual(
      jasmine.arrayContaining(['customer-search', 'customer-add']),
    );
    expect(dashboardGraphDescendantNodeIds('customers', favoriteCustomers)).not.toContain(
      'customer-favorites',
    );
    expect(dashboardGraphDescendantNodeIds('customer-favorites', favoriteCustomers)).toEqual(
      jasmine.arrayContaining([
        'customer-katja-gross',
        'customer-alex-sommer',
        'customer-katja-gross-profile',
        'customer-katja-gross-appointment-list',
        'customer-katja-gross-delete',
        'customer-katja-gross-dog-add',
        'customer-katja-gross-detach',
      ]),
    );
    expect(
      buildDashboardGraphNodes(favoriteCustomers, staleExpandedNodeIds).map((node) => node.id),
    ).not.toEqual(
      jasmine.arrayContaining(['customer-katja-gross', 'customer-katja-gross-profile']),
    );
    expect(buildDashboardGraphEdges(favoriteCustomers, staleExpandedNodeIds)).not.toEqual(
      jasmine.arrayContaining([
        { from: 'customer-favorites', to: 'customer-katja-gross' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-profile' },
      ]),
    );
  });

  it('derives sibling subtrees generically from the fully expanded graph edges', () => {
    expect(dashboardGraphSiblingSubtreeNodeIds('customer-alex-sommer', favoriteCustomers)).toEqual(
      jasmine.arrayContaining([
        'customer-katja-gross',
        'customer-katja-gross-profile',
        'customer-katja-gross-appointment-list',
        'customer-katja-gross-delete',
        'customer-katja-gross-dog-add',
        'customer-katja-gross-detach',
      ]),
    );
    expect(
      dashboardGraphSiblingSubtreeNodeIds('customer-alex-sommer', favoriteCustomers),
    ).not.toContain('customer-search');

    expect(dashboardGraphSiblingSubtreeNodeIds('customer-favorites', favoriteCustomers)).toEqual(
      jasmine.arrayContaining(['customer-search', 'customer-add']),
    );
  });

  it('adds Hund hinzufügen as an action under the Hunde collection for manager roles only', () => {
    const managerNodes = buildDashboardGraphNodes([], new Set(['dogs']), undefined, 'groomer');
    const managerEdges = buildDashboardGraphEdges([], new Set(['dogs']), 'groomer');
    const customerNodes = buildDashboardGraphNodes([], new Set(['dogs']), undefined, 'kunde');

    expect(managerNodes.find((node) => node.id === 'dog-add')).toEqual(
      jasmine.objectContaining({
        label: 'Hund hinzufügen',
        kind: 'action',
        action: 'custom',
      }),
    );
    expect(managerEdges).toEqual(jasmine.arrayContaining([{ from: 'dogs', to: 'dog-add' }]));
    expect(customerNodes.map((node) => node.id)).not.toContain('dog-add');
    expect(hasDashboardGraphChildren('dogs', [], 'groomer')).toBeTrue();
    expect(hasDashboardGraphChildren('dogs', [], 'kunde')).toBeFalse();
  });

  it('separates concrete dog context nodes from Hunde action nodes in the radial layout', () => {
    const expandedNodeIds = new Set(['dogs']);
    const nodes = buildDashboardGraphNodes([], expandedNodeIds, 'dogs', 'groomer', visibleDogs);
    const edges = buildDashboardGraphEdges([], expandedNodeIds, 'groomer', visibleDogs);
    const layout = computeRadialGraphLayout(
      nodes.map((node) => ({
        id: node.id,
        type: node.kind,
        preferredAngle: node.layout?.angle,
        preferredDistance: node.layout?.distance,
      })),
      edges,
      {
        rootId: 'start',
        center: { x: 520, y: 340 },
        levelDistance: 190,
        siblingAngle: 32,
        rootStartAngle: 0,
      },
    );
    const dogAddPosition = layout.get('dog-add')!;
    const dogContextPositions = visibleDogs.map((dog) => layout.get(dog.id)!);
    const dogContextNodes = visibleDogs.map((dog) => nodes.find((node) => node.id === dog.id)!);

    expect(nodes.find((node) => node.id === 'dog-search')?.layout?.angle).toBe(310);
    expect(nodes.find((node) => node.id === 'dog-list')?.layout?.angle).toBe(0);
    expect(nodes.find((node) => node.id === 'dog-add')?.layout?.angle).toBe(50);
    expect(dogContextNodes.map((node) => node.layout?.angle)).toEqual([90, 210]);
    expect(dogContextNodes.every((node) => node.layout?.distance === 260)).toBeTrue();
    expect(dogContextNodes[0].labelLines).toEqual(['wau', 'Katja Gross']);
    expect(dogContextNodes[1].labelLines).toEqual(['kakkkkkk', 'Hans Wuest']);
    dogContextPositions.forEach((position) => {
      expect(
        Math.hypot(position.x - dogAddPosition.x, position.y - dogAddPosition.y),
      ).toBeGreaterThan(150);
    });
  });

  it('shows destructive customer delete action nodes only for admins', () => {
    const expandedNodeIds = new Set(['customers', 'customer-favorites', 'customer-katja-gross']);

    const adminNodes = buildDashboardGraphNodes(
      favoriteCustomers,
      expandedNodeIds,
      undefined,
      'admin',
    );
    const adminEdges = buildDashboardGraphEdges(favoriteCustomers, expandedNodeIds, 'admin');
    const groomerNodes = buildDashboardGraphNodes(
      favoriteCustomers,
      expandedNodeIds,
      undefined,
      'groomer',
    );
    const groomerEdges = buildDashboardGraphEdges(favoriteCustomers, expandedNodeIds, 'groomer');

    expect(adminNodes.map((node) => node.id)).toContain('customer-katja-gross-delete');
    expect(adminEdges).toContain({
      from: 'customer-katja-gross',
      to: 'customer-katja-gross-delete',
    });
    expect(groomerNodes.map((node) => node.id)).not.toContain('customer-katja-gross-delete');
    expect(groomerEdges).not.toContain({
      from: 'customer-katja-gross',
      to: 'customer-katja-gross-delete',
    });
  });

  it('returns every expandable node id for expanding the current flex graph', () => {
    expect(expandableDashboardGraphNodeIds([])).toEqual([
      'groomers',
      'calendar',
      'admin',
      'customers',
      'customer-favorites',
      'dogs',
    ]);

    expect(expandableDashboardGraphNodeIds(favoriteCustomers)).toEqual([
      'groomers',
      'calendar',
      'admin',
      'customers',
      'customer-favorites',
      'dogs',
      'customer-katja-gross',
      'customer-alex-sommer',
    ]);
  });

  it('does not add customer-only profile nodes to the manager expandable set', () => {
    expect(expandableDashboardGraphNodeIds(favoriteCustomers, 'kunde')).toEqual([
      'groomers',
      'calendar',
      'admin',
      'customers',
      'dogs',
    ]);
  });

  it('detects whether the current flex graph is fully expanded', () => {
    expect(
      isDashboardGraphFullyExpanded(
        [],
        new Set(['groomers', 'calendar', 'admin', 'customers', 'dogs', 'customer-favorites']),
      ),
    ).toBeTrue();
    expect(isDashboardGraphFullyExpanded([], new Set(['groomers', 'calendar']))).toBeFalse();

    expect(
      isDashboardGraphFullyExpanded(
        favoriteCustomers,
        new Set([
          'groomers',
          'calendar',
          'admin',
          'customers',
          'dogs',
          'customer-favorites',
          'customer-katja-gross',
          'customer-alex-sommer',
        ]),
      ),
    ).toBeTrue();
  });
});

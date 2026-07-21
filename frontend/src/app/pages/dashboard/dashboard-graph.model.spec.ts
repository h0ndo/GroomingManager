import {
  buildDashboardGraphEdges,
  buildDashboardGraphNodes,
  expandableDashboardGraphNodeIds,
  isDashboardGraphFullyExpanded,
  type CustomerInstance,
} from './dashboard-graph.model';

const favoriteCustomers: CustomerInstance[] = [
  { id: 'customer-katja-gross', firstName: 'Katja', lastName: 'Gross', avatarUrl: '/avatars/katja.png' },
  { id: 'customer-alex-sommer', firstName: 'Alex', lastName: 'Sommer' },
];

describe('dashboard graph model', () => {
  it('starts with only start and the top-level domains visible', () => {
    const nodes = buildDashboardGraphNodes([], new Set());
    const edges = buildDashboardGraphEdges([], new Set());

    expect(nodes.map((node) => node.id)).toEqual(['start', 'groomers', 'calendar', 'admin', 'customers', 'dogs']);
    expect(edges).toEqual([
      { from: 'start', to: 'groomers' },
      { from: 'start', to: 'calendar' },
      { from: 'start', to: 'admin' },
      { from: 'start', to: 'customers' },
      { from: 'start', to: 'dogs' },
    ]);
  });

  it('shows second-level customer search, add and favorites only for manager roles', () => {
    const expandedNodeIds = new Set(['calendar', 'customers']);
    const nodes = buildDashboardGraphNodes(favoriteCustomers, expandedNodeIds, undefined, 'groomer');
    const edges = buildDashboardGraphEdges(favoriteCustomers, expandedNodeIds, 'groomer');

    expect(nodes.map((node) => node.id)).toEqual(
      jasmine.arrayContaining(['start', 'calendar', 'customers', 'appointments', 'customer-search', 'customer-add', 'customer-favorites']),
    );
    expect(nodes.map((node) => node.id)).not.toContain('admin-groomer-add');
    expect(nodes.map((node) => node.id)).not.toContain('groomer-appointment-list');
    expect(edges).toEqual(
      jasmine.arrayContaining([
        { from: 'calendar', to: 'appointments' },
        { from: 'customers', to: 'customer-search' },
        { from: 'customers', to: 'customer-add' },
        { from: 'customers', to: 'customer-favorites' },
      ]),
    );
    expect(edges).not.toContain({ from: 'admin', to: 'admin-groomer-add' });
  });

  it('hides search and favorites for the customer role and exposes only the own profile area', () => {
    const expandedNodeIds = new Set(['customers']);
    const nodes = buildDashboardGraphNodes(favoriteCustomers, expandedNodeIds, undefined, 'kunde');
    const edges = buildDashboardGraphEdges(favoriteCustomers, expandedNodeIds, 'kunde');

    expect(nodes.map((node) => node.id)).toEqual(jasmine.arrayContaining(['customers', 'customer-self-profile']));
    expect(nodes.map((node) => node.id)).not.toContain('customer-search');
    expect(nodes.map((node) => node.id)).not.toContain('customer-favorites');
    expect(edges).toEqual(jasmine.arrayContaining([{ from: 'customers', to: 'customer-self-profile' }]));
    expect(edges).not.toContain({ from: 'customers', to: 'customer-search' });
  });

  it('rotates the selected top-level domain to the horizontal right while preserving the top-level order', () => {
    const nodes = buildDashboardGraphNodes([], new Set(), 'calendar');

    expect(nodes.find((node) => node.id === 'calendar')?.layout?.angle).toBe(0);
    expect(nodes.find((node) => node.id === 'admin')?.layout?.angle).toBe(72);
    expect(nodes.find((node) => node.id === 'customers')?.layout?.angle).toBe(144);
    expect(nodes.find((node) => node.id === 'dogs')?.layout?.angle).toBe(216);
    expect(nodes.find((node) => node.id === 'groomers')?.layout?.angle).toBe(288);
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
    expect(edges).toEqual(jasmine.arrayContaining([{ from: 'customer-favorites', to: 'customer-1' }]));
  });

  it('keeps one to six favorites readable with compact two-line labels and a wider radial distance', () => {
    const sixCustomers = Array.from({ length: 6 }, (_, index) => ({
      id: `customer-${index + 1}`,
      firstName: `SehrlangerVorname${index + 1}`,
      lastName: `SehrlangerNachname${index + 1}`,
    }));
    const nodes = buildDashboardGraphNodes(sixCustomers, new Set(['customers', 'customer-favorites']));
    const favoriteNodes = nodes.filter((node) => node.kind === 'instance');

    expect(favoriteNodes).toHaveSize(6);
    expect(favoriteNodes.every((node) => node.layout?.distance === 190)).toBeTrue();
    favoriteNodes.forEach((node, index) => {
      expect(node.label).toBe(`SehrlangerVorname${index + 1} SehrlangerNachname${index + 1}`);
      expect(node.labelLines).toEqual(['SehrlangerVo…', 'SehrlangerNa…']);
      expect(node.labelLines?.every((line) => line.length <= 13)).toBeTrue();
    });

    const singleFavoriteNodes = buildDashboardGraphNodes([sixCustomers[0]], new Set(['customers', 'customer-favorites'])).filter(
      (node) => node.kind === 'instance',
    );

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
        'customer-katja-gross-detach',
      ]),
    );
    expect(edges).toEqual(
      jasmine.arrayContaining([
        { from: 'customer-favorites', to: 'customer-katja-gross' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-profile' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-appointment-list' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-delete' },
        { from: 'customer-katja-gross', to: 'customer-katja-gross-detach' },
      ]),
    );
  });

  it('returns every expandable node id for expanding the current flex graph', () => {
    expect(expandableDashboardGraphNodeIds([])).toEqual(['groomers', 'calendar', 'admin', 'customers', 'dogs', 'customer-favorites']);

    expect(expandableDashboardGraphNodeIds(favoriteCustomers)).toEqual([
      'groomers',
      'calendar',
      'admin',
      'customers',
      'dogs',
      'customer-favorites',
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
    expect(isDashboardGraphFullyExpanded([], new Set(['groomers', 'calendar', 'admin', 'customers', 'dogs', 'customer-favorites']))).toBeTrue();
    expect(isDashboardGraphFullyExpanded([], new Set(['groomers', 'calendar']))).toBeFalse();

    expect(
      isDashboardGraphFullyExpanded(
        favoriteCustomers,
        new Set(['groomers', 'calendar', 'admin', 'customers', 'dogs', 'customer-favorites', 'customer-katja-gross', 'customer-alex-sommer']),
      ),
    ).toBeTrue();
  });
});

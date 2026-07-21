import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkspaceGraph, WorkspaceGraphEdge, WorkspaceGraphNode } from './workspace-graph';

type WorkspaceGraphTestHost = {
  fitStatusMessage: () => string;
  fitToView: () => void;
  isPanning: () => boolean;
  isFitPannable: () => boolean;
  nodePosition: (node: WorkspaceGraphNode) => { x: number; y: number };
  nodePositions: { set: (positions: Record<string, { x: number; y: number }>) => void };
  translatedCanvas: () => string;
  viewport: { nativeElement: { clientWidth: number; clientHeight: number } };
};

function buttonByText(fixture: ComponentFixture<WorkspaceGraph>, text: string): HTMLButtonElement {
  const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
  const button = buttons.find((candidate) => candidate.textContent?.includes(text));

  if (!button) {
    throw new Error(`Button with text "${text}" not found`);
  }

  return button;
}

describe('WorkspaceGraph', () => {
  let fixture: ComponentFixture<WorkspaceGraph>;

  const nodes: WorkspaceGraphNode[] = [
    { id: 'start', label: 'Start', kind: 'root', x: 100, y: 100 },
    { id: 'far-away', label: 'Far away', kind: 'domain', x: 900, y: 560 },
  ];
  const edges: WorkspaceGraphEdge[] = [{ from: 'start', to: 'far-away' }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkspaceGraph] }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceGraph);
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('edges', edges);
    fixture.componentRef.setInput('autoLayout', false);
  });

  it('shows the fit-to-view control only when enabled', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Alles einpassen');

    fixture.componentRef.setInput('showFitToViewControl', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alles einpassen');
  });

  it('renders the root node as a larger branded logo node with an accessible start label', () => {
    const graphNodes = [
      {
        id: 'start',
        label: 'Start Schnittstelle 2',
        kind: 'root' as const,
        logoUrl: '/s2.png',
      },
      { id: 'customers', label: 'Kunden', kind: 'domain' as const },
    ];

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', [{ from: 'start', to: 'customers' }]);
    fixture.componentRef.setInput('autoLayout', true);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as WorkspaceGraphTestHost;
    const rootButton = fixture.nativeElement.querySelector('[data-node-id="start"]') as HTMLButtonElement;
    const customerButton = buttonByText(fixture, 'Kunden');
    const rootLogo = rootButton.querySelector('.workspace-graph__logo') as HTMLImageElement | null;
    const rootPosition = component.nodePosition(graphNodes[0]);
    const customerPosition = component.nodePosition(graphNodes[1]);

    expect(rootButton.classList).toContain('workspace-graph__node--root');
    expect(rootButton.style.getPropertyValue('--node-size')).toBe('7.5rem');
    expect(customerButton.style.getPropertyValue('--node-size')).toBe('');
    expect(rootLogo).not.toBeNull();
    expect(rootLogo?.getAttribute('src')).toBe('/s2.png');
    expect(rootLogo?.getAttribute('alt')).toBe('');
    expect(rootButton.getAttribute('aria-label')).toContain('Start Schnittstelle 2, Übersicht');
    expect(Math.hypot(customerPosition.x - rootPosition.x, customerPosition.y - rootPosition.y)).toBeGreaterThan(180);
  });

  it('keeps fit-to-view at readable zoom and announces pannable overflow', () => {
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as WorkspaceGraphTestHost;
    component.viewport = { nativeElement: { clientWidth: 520, clientHeight: 340 } };

    component.fitToView();

    expect(component.translatedCanvas()).toContain('scale(0.75)');
    expect(component.translatedCanvas()).not.toBe('translate3d(0px, 0px, 0) scale(1)');
    expect(component.isFitPannable()).toBeTrue();
    expect(component.fitStatusMessage()).toContain('Graph ist bei lesbarer Größe größer');

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.workspace-graph__viewport--pannable')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#workspace-graph-fit-status')?.textContent).toContain(
      'Ziehe oder scrolle',
    );
  });

  it('centers the active focused-work node and shifts the rest of the graph left', () => {
    const graphNodes: WorkspaceGraphNode[] = [
      { id: 'start', label: 'Start', kind: 'root' },
      { id: 'customers', label: 'Kunden', kind: 'domain', layout: { angle: 0 } },
      { id: 'dogs', label: 'Hunde', kind: 'domain', layout: { angle: 180 } },
    ];
    const graphEdges: WorkspaceGraphEdge[] = [
      { from: 'start', to: 'customers' },
      { from: 'start', to: 'dogs' },
    ];

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', graphEdges);
    fixture.componentRef.setInput('autoLayout', true);
    fixture.componentRef.setInput('lockAnchoredNodesToAutoLayout', true);
    fixture.componentRef.setInput('centeredNodeId', 'customers');
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as WorkspaceGraphTestHost;
    const activePosition = component.nodePosition(graphNodes[1]);
    const rootPosition = component.nodePosition(graphNodes[0]);

    expect(activePosition.x).toBeCloseTo(520, 5);
    expect(activePosition.y).toBeCloseTo(340, 5);
    expect(rootPosition.x).toBeLessThan(activePosition.x);
  });

  it('keeps focused-work node pointer clicks on the activation path instead of starting viewport panning', () => {
    const graphNodes: WorkspaceGraphNode[] = [
      { id: 'start', label: 'Start', kind: 'root' },
      { id: 'customers', label: 'Kunden', kind: 'domain', layout: { angle: 0 } },
    ];
    const graphEdges: WorkspaceGraphEdge[] = [{ from: 'start', to: 'customers' }];
    let activatedNodeId = '';

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', graphEdges);
    fixture.componentRef.setInput('autoLayout', true);
    fixture.componentRef.setInput('lockAnchoredNodesToAutoLayout', true);
    fixture.componentRef.setInput('activeNodeId', 'start');
    fixture.componentInstance.nodeActivated.subscribe((selection) => {
      activatedNodeId = selection.node.id;
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as WorkspaceGraphTestHost;
    const customerButton = buttonByText(fixture, 'Kunden');

    customerButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }));
    fixture.detectChanges();

    expect(component.isPanning()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.workspace-graph__viewport--panning')).toBeNull();

    customerButton.click();

    expect(activatedNodeId).toBe('customers');
  });

  it('recomputes child nodes radial to a manually moved parent in custom flex mode', () => {
    const graphNodes: WorkspaceGraphNode[] = [
      { id: 'start', label: 'Start', kind: 'root' },
      { id: 'customers', label: 'Kunden', kind: 'domain' },
      { id: 'customer-search', label: 'Suchen', kind: 'action' },
    ];
    const graphEdges: WorkspaceGraphEdge[] = [
      { from: 'start', to: 'customers' },
      { from: 'customers', to: 'customer-search' },
    ];

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', graphEdges);
    fixture.componentRef.setInput('autoLayout', true);
    fixture.componentRef.setInput('lockAnchoredNodesToAutoLayout', false);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as WorkspaceGraphTestHost;
    const originalParentPosition = component.nodePosition(graphNodes[1]);
    const originalChildPosition = component.nodePosition(graphNodes[2]);
    const movedParentPosition = { x: originalParentPosition.x + 180, y: originalParentPosition.y + 90 };

    component.nodePositions.set({
      customers: movedParentPosition,
      'customer-search': originalChildPosition,
    });

    const movedChildPosition = component.nodePosition(graphNodes[2]);

    expect(movedChildPosition.x - movedParentPosition.x).toBeCloseTo(originalChildPosition.x - originalParentPosition.x, 5);
    expect(movedChildPosition.y - movedParentPosition.y).toBeCloseTo(originalChildPosition.y - originalParentPosition.y, 5);

    const secondMovedParentPosition = { x: originalParentPosition.x - 120, y: originalParentPosition.y + 160 };
    component.nodePositions.set({
      customers: secondMovedParentPosition,
      'customer-search': originalChildPosition,
    });

    const secondMovedChildPosition = component.nodePosition(graphNodes[2]);

    expect(secondMovedChildPosition.x - secondMovedParentPosition.x).toBeCloseTo(
      originalChildPosition.x - originalParentPosition.x,
      5,
    );
    expect(secondMovedChildPosition.y - secondMovedParentPosition.y).toBeCloseTo(
      originalChildPosition.y - originalParentPosition.y,
      5,
    );
  });

  it('keeps six favorite instance nodes readable around the favorites context and follows moved parent nodes', () => {
    const graphNodes: WorkspaceGraphNode[] = [
      { id: 'start', label: 'Start', kind: 'root' },
      { id: 'customers', label: 'Kunden', kind: 'domain', layout: { angle: 0 } },
      { id: 'customer-favorites', label: 'Favoriten', kind: 'page' },
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `customer-${index + 1}`,
        label: `Kunde ${index + 1}`,
        kind: 'instance' as const,
        layout: { distance: 190 },
      })),
    ];
    const graphEdges: WorkspaceGraphEdge[] = [
      { from: 'start', to: 'customers' },
      { from: 'customers', to: 'customer-favorites' },
      ...Array.from({ length: 6 }, (_, index) => ({ from: 'customer-favorites', to: `customer-${index + 1}` })),
    ];

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', graphEdges);
    fixture.componentRef.setInput('autoLayout', true);
    fixture.componentRef.setInput('lockAnchoredNodesToAutoLayout', true);
    fixture.componentRef.setInput('centeredNodeId', 'customer-favorites');
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as WorkspaceGraphTestHost;
    const favoritesPosition = component.nodePosition(graphNodes[2]);
    const favoritePositions = graphNodes.slice(3).map((node) => component.nodePosition(node));

    expect(favoritesPosition.x).toBeCloseTo(520, 5);
    expect(favoritesPosition.y).toBeCloseTo(340, 5);
    favoritePositions.forEach((position) => {
      expect(Math.hypot(position.x - favoritesPosition.x, position.y - favoritesPosition.y)).toBeCloseTo(190, 5);
    });
    favoritePositions.slice(1).forEach((position, index) => {
      const previousPosition = favoritePositions[index];

      expect(Math.hypot(position.x - previousPosition.x, position.y - previousPosition.y)).toBeGreaterThan(95);
    });

    fixture.componentRef.setInput('lockAnchoredNodesToAutoLayout', false);
    fixture.componentRef.setInput('centeredNodeId', '');
    const customCustomerPosition = component.nodePosition(graphNodes[1]);
    const customFavoritesPosition = component.nodePosition(graphNodes[2]);
    const customFavoriteChildPosition = component.nodePosition(graphNodes[3]);
    const movedCustomerPosition = { x: customCustomerPosition.x - 140, y: customCustomerPosition.y + 120 };
    component.nodePositions.set({
      customers: movedCustomerPosition,
      'customer-1': customFavoriteChildPosition,
    });

    const movedFavoritesPosition = component.nodePosition(graphNodes[2]);
    const movedFavoriteChildPosition = component.nodePosition(graphNodes[3]);

    expect(movedFavoritesPosition.x - movedCustomerPosition.x).toBeCloseTo(
      customFavoritesPosition.x - customCustomerPosition.x,
      5,
    );
    expect(movedFavoritesPosition.y - movedCustomerPosition.y).toBeCloseTo(
      customFavoritesPosition.y - customCustomerPosition.y,
      5,
    );
    expect(movedFavoriteChildPosition.x - movedFavoritesPosition.x).toBeCloseTo(
      customFavoriteChildPosition.x - customFavoritesPosition.x,
      5,
    );
    expect(movedFavoriteChildPosition.y - movedFavoritesPosition.y).toBeCloseTo(
      customFavoriteChildPosition.y - customFavoritesPosition.y,
      5,
    );
  });

  it('renders a synchronized hierarchical linear alternative for the visible graph nodes', () => {
    const graphNodes: WorkspaceGraphNode[] = [
      { id: 'start', label: 'Start', kind: 'root' },
      { id: 'customers', label: 'Kunden', kind: 'domain', description: 'Kundenliste und Kundenkontext' },
      { id: 'customer-search', label: 'Suchen', kind: 'action' },
    ];
    const graphEdges: WorkspaceGraphEdge[] = [
      { from: 'start', to: 'customers' },
      { from: 'customers', to: 'customer-search' },
    ];

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', graphEdges);
    fixture.componentRef.setInput('activeNodeId', 'customers');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Arbeitsgraph als Liste');

    buttonByText(fixture, 'Als Liste anzeigen').click();
    fixture.detectChanges();

    const linearText = fixture.nativeElement.querySelector('.workspace-graph__linear')?.textContent ?? '';
    const activeLinearNode = fixture.nativeElement.querySelector('.workspace-graph__linear-node--active');
    const groupHeadings = (Array.from(
      fixture.nativeElement.querySelectorAll('.workspace-graph__linear-group h4'),
    ) as HTMLElement[]).map(
      (heading) => heading.textContent ?? '',
    );
    const childRows = Array.from(fixture.nativeElement.querySelectorAll('.workspace-graph__linear-list--children li')) as HTMLElement[];

    expect(linearText).toContain('Start');
    expect(linearText).toContain('Kunden');
    expect(linearText).toContain('Suchen');
    expect(linearText.indexOf('Start')).toBeLessThan(linearText.indexOf('Kunden'));
    expect(linearText.indexOf('Kunden')).toBeLessThan(linearText.indexOf('Suchen'));
    expect(activeLinearNode?.textContent).toContain('Kunden');
    expect(groupHeadings).toEqual(jasmine.arrayContaining([jasmine.stringContaining('Kunden, Domäne, aufgeklappt')]));
    expect(childRows[0].style.getPropertyValue('--graph-depth')).toBe('1');
  });

  it('exposes active state, type and relationships in node accessibility labels', () => {
    const graphNodes: WorkspaceGraphNode[] = [
      { id: 'start', label: 'Start', kind: 'root' },
      { id: 'customers', label: 'Kunden', kind: 'domain' },
      { id: 'customer-search', label: 'Suchen', kind: 'action' },
    ];
    const graphEdges: WorkspaceGraphEdge[] = [
      { from: 'start', to: 'customers' },
      { from: 'customers', to: 'customer-search' },
    ];

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', graphEdges);
    fixture.componentRef.setInput('activeNodeId', 'customers');
    fixture.detectChanges();

    const customerButton = buttonByText(fixture, 'Kunden');

    expect(customerButton.getAttribute('aria-current')).toBe('true');
    expect(customerButton.getAttribute('aria-label')).toContain('Kunden, Domäne. Aktiver Arbeitsknoten');
    expect(customerButton.getAttribute('aria-label')).toContain('gehört zu Start');
    expect(customerButton.getAttribute('aria-label')).toContain('verbunden mit Suchen');
  });

  it('marks only top-level nodes as draggable in custom flex mode', () => {
    const graphNodes: WorkspaceGraphNode[] = [
      { id: 'start', label: 'Start', kind: 'root' },
      { id: 'customers', label: 'Kunden', kind: 'domain' },
      { id: 'customer-search', label: 'Suchen', kind: 'action' },
    ];
    const graphEdges: WorkspaceGraphEdge[] = [
      { from: 'start', to: 'customers' },
      { from: 'customers', to: 'customer-search' },
    ];

    fixture.componentRef.setInput('nodes', graphNodes);
    fixture.componentRef.setInput('edges', graphEdges);
    fixture.componentRef.setInput('autoLayout', true);
    fixture.componentRef.setInput('lockAnchoredNodesToAutoLayout', false);
    fixture.detectChanges();

    expect(buttonByText(fixture, 'Start').classList).not.toContain('workspace-graph__node--draggable');
    expect(buttonByText(fixture, 'Kunden').classList).toContain('workspace-graph__node--draggable');
    expect(buttonByText(fixture, 'Suchen').classList).not.toContain('workspace-graph__node--draggable');
  });
});

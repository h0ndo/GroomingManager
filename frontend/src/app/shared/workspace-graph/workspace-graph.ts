import { NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { computeRadialGraphLayout } from './core/radial-graph-layout';

export type WorkspaceGraphNodeKind = 'root' | 'domain' | 'page' | 'action' | 'instance';

export type WorkspaceGraphAction =
  'navigate' | 'open-panel' | 'create-instance' | 'remove-instance' | 'custom';

export type WorkspaceGraphNode = {
  id: string;
  label: string;
  labelLines?: string[];
  kind: WorkspaceGraphNodeKind;
  x?: number;
  y?: number;
  layout?: {
    angle?: number;
    distance?: number;
  };
  icon?: string;
  logoUrl?: string;
  rootNodeSize?: string;
  avatarUrl?: string;
  description?: string;
  route?: string;
  action?: WorkspaceGraphAction;
  payload?: unknown;
};

export type WorkspaceGraphEdge = {
  from: string;
  to: string;
  label?: string;
};

export type WorkspaceGraphSelection = {
  node: WorkspaceGraphNode;
  connectedNodes: WorkspaceGraphNode[];
  sourceOrigin?: WorkspaceGraphNodeOrigin;
};

export type WorkspaceGraphNodeOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LinearGraphNode = {
  node: WorkspaceGraphNode;
  depth: number;
};

type LinearGraphGroup = {
  domain: LinearGraphNode;
  children: LinearGraphNode[];
};

type Point = {
  x: number;
  y: number;
};

@Component({
  selector: 'app-workspace-graph',
  imports: [NgClass],
  templateUrl: './workspace-graph.html',
  styleUrl: './workspace-graph.scss',
})
export class WorkspaceGraph {
  private static readonly MIN_READABLE_ZOOM = 0.75;
  private static readonly MAX_ZOOM = 1.8;
  private static readonly FIT_VIEWPORT_PADDING = 32;
  private static readonly FIT_BOTTOM_SAFE_AREA = 48;
  private static readonly FIT_NODE_RADIUS = 72;
  private static readonly FIT_LABEL_SAFE_WIDTH = 168;
  private static readonly FIT_LABEL_SAFE_HEIGHT = 112;
  private static readonly ROOT_LEVEL_DISTANCE = 190;

  @Input({ required: true }) nodes: WorkspaceGraphNode[] = [];
  @Input({ required: true }) edges: WorkspaceGraphEdge[] = [];
  @Input() activeNodeId = '';
  @Input() width = 1040;
  @Input() height = 680;
  @Input() autoLayout = true;
  @Input() lockAnchoredNodesToAutoLayout = true;
  @Input() showFitToViewControl = false;
  @Input() centeredNodeId = '';
  @Input() expandedNodeIds: ReadonlySet<string> = new Set();
  @Input() expandableNodeIds: readonly string[] = [];

  @Output() nodeActivated = new EventEmitter<WorkspaceGraphSelection>();

  @ViewChild('viewport') private viewport?: ElementRef<HTMLElement>;

  protected readonly pan = signal({ x: 0, y: 0 });
  protected readonly zoom = signal(1);
  protected readonly isPanning = signal(false);
  protected readonly isDraggingNode = signal(false);
  protected readonly nodePositions = signal<Record<string, Point>>({});
  protected readonly showLinearView = signal(false);
  protected readonly fitStatusMessage = signal('');
  protected readonly isFitPannable = signal(false);
  protected readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));
  protected readonly translatedCanvas = computed(() => {
    const pan = this.pan();
    return `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${this.zoom()})`;
  });
  protected readonly linearGraphNodes = computed<LinearGraphNode[]>(() =>
    this.buildLinearGraphNodes(),
  );
  protected readonly linearGraphRoot = computed<LinearGraphNode | undefined>(() =>
    this.linearGraphNodes().find((entry) => entry.node.id === 'start'),
  );
  protected readonly linearGraphGroups = computed<LinearGraphGroup[]>(() =>
    this.buildLinearGraphGroups(),
  );
  protected readonly linearGraphOrphans = computed<LinearGraphNode[]>(() =>
    this.linearGraphNodes().filter((entry) => entry.node.id !== 'start' && entry.depth === 0),
  );

  private dragStart: {
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null = null;
  private nodeDragStart: {
    pointerId: number;
    nodeId: string;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null = null;
  private suppressNextClickNodeId: string | null = null;

  protected edgeLine(
    edge: WorkspaceGraphEdge,
  ): { x1: number; y1: number; x2: number; y2: number } | null {
    const from = this.nodeById().get(edge.from);
    const to = this.nodeById().get(edge.to);

    if (!from || !to) {
      return null;
    }

    const fromPosition = this.nodePosition(from);
    const toPosition = this.nodePosition(to);

    return { x1: fromPosition.x, y1: fromPosition.y, x2: toPosition.x, y2: toPosition.y };
  }

  protected edgeLength(line: { x1: number; y1: number; x2: number; y2: number }): number {
    return Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
  }

  protected edgeAngle(line: { x1: number; y1: number; x2: number; y2: number }): number {
    return (Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180) / Math.PI;
  }

  protected edgeBox(line: { x1: number; y1: number; x2: number; y2: number }): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    return {
      left: Math.min(line.x1, line.x2),
      top: Math.min(line.y1, line.y2),
      width: Math.max(1, Math.abs(line.x2 - line.x1)),
      height: Math.max(1, Math.abs(line.y2 - line.y1)),
    };
  }

  protected edgeBoxLine(line: { x1: number; y1: number; x2: number; y2: number }): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } {
    return {
      x1: line.x1 <= line.x2 ? 0 : 100,
      y1: line.y1 <= line.y2 ? 0 : 100,
      x2: line.x1 <= line.x2 ? 100 : 0,
      y2: line.y1 <= line.y2 ? 100 : 0,
    };
  }

  protected nodeById(): Map<string, WorkspaceGraphNode> {
    return new Map(this.nodes.map((node) => [node.id, node]));
  }

  protected autoLayoutPositions(): Map<string, Point> {
    const layoutNodes = this.nodes.map((node) => ({
      id: node.id,
      type: node.kind,
      preferredAngle: node.layout?.angle,
      preferredDistance: node.layout?.distance,
    }));

    return computeRadialGraphLayout(layoutNodes, this.edges, {
      rootId: 'start',
      center: { x: this.width / 2, y: this.height / 2 },
      levelDistance: WorkspaceGraph.ROOT_LEVEL_DISTANCE,
      siblingAngle: 32,
      rootStartAngle: 0,
    });
  }

  protected nodePosition(node: WorkspaceGraphNode): Point {
    const manualPosition = this.nodePositions()[node.id];
    const autoPosition = this.autoLayoutPositions().get(node.id);

    if (this.shouldCenterActiveNode(autoPosition)) {
      return this.centeredAutoLayoutPosition(node, autoPosition);
    }

    if (
      this.lockAnchoredNodesToAutoLayout &&
      this.autoLayout &&
      autoPosition &&
      node.layout?.angle !== undefined
    ) {
      return { x: autoPosition.x, y: autoPosition.y };
    }

    if (autoPosition && this.shouldFollowParentPosition(node, autoPosition)) {
      const relativePosition = this.nodePositionRelativeToParent(node, autoPosition);

      if (relativePosition) {
        return relativePosition;
      }
    }

    if (manualPosition) {
      return manualPosition;
    }

    if (!this.lockAnchoredNodesToAutoLayout && this.autoLayout && autoPosition) {
      const relativePosition = this.nodePositionRelativeToParent(node, autoPosition);

      if (relativePosition) {
        return relativePosition;
      }
    }

    if (this.autoLayout && autoPosition) {
      return { x: autoPosition.x, y: autoPosition.y };
    }

    return { x: node.x ?? this.width / 2, y: node.y ?? this.height / 2 };
  }

  protected nodePositionRelativeToParent(
    node: WorkspaceGraphNode,
    autoPosition: Point,
  ): Point | null {
    const parentEdge = this.parentEdge(node);

    if (!parentEdge) {
      return null;
    }

    const parentNode = this.nodeById().get(parentEdge.from);
    const parentAutoPosition = this.autoLayoutPositions().get(parentEdge.from);

    if (!parentNode || !parentAutoPosition) {
      return null;
    }

    const parentPosition = this.nodePosition(parentNode);

    return {
      x: parentPosition.x + autoPosition.x - parentAutoPosition.x,
      y: parentPosition.y + autoPosition.y - parentAutoPosition.y,
    };
  }

  private parentEdge(node: WorkspaceGraphNode): WorkspaceGraphEdge | undefined {
    return this.edges.find((edge) => edge.to === node.id);
  }

  private centeredAutoLayoutPosition(
    node: WorkspaceGraphNode,
    autoPosition: Point | undefined,
  ): Point {
    const centeredPosition = this.centeredNodeAutoPosition();

    if (!autoPosition || !centeredPosition) {
      return { x: node.x ?? this.width / 2, y: node.y ?? this.height / 2 };
    }

    return {
      x: autoPosition.x - centeredPosition.x + this.width / 2,
      y: autoPosition.y - centeredPosition.y + this.height / 2,
    };
  }

  private centeredNodeAutoPosition(): Point | undefined {
    return this.autoLayoutPositions().get(this.centeredNodeId);
  }

  private shouldCenterActiveNode(autoPosition: Point | undefined): boolean {
    return (
      this.lockAnchoredNodesToAutoLayout &&
      this.autoLayout &&
      !!this.centeredNodeId &&
      !!autoPosition
    );
  }

  private shouldFollowParentPosition(
    node: WorkspaceGraphNode,
    autoPosition: Point | undefined,
  ): boolean {
    return (
      !this.lockAnchoredNodesToAutoLayout &&
      this.autoLayout &&
      !!autoPosition &&
      this.parentEdge(node)?.from !== 'start'
    );
  }

  protected nodeSpawnOffset(node: WorkspaceGraphNode): Point {
    const parentEdge = this.edges.find((edge) => edge.to === node.id);

    if (!parentEdge) {
      return { x: 0, y: 0 };
    }

    const parentNode = this.nodeById().get(parentEdge.from);

    if (!parentNode) {
      return { x: 0, y: 0 };
    }

    const position = this.nodePosition(node);
    const parentPosition = this.nodePosition(parentNode);

    return {
      x: parentPosition.x - position.x,
      y: parentPosition.y - position.y,
    };
  }

  protected nodeClass(node: WorkspaceGraphNode): Record<string, boolean> {
    return {
      [`workspace-graph__node--${node.kind}`]: true,
      'workspace-graph__node--branded-root': node.kind === 'root' && !!node.logoUrl,
      'workspace-graph__node--active': node.id === this.activeNodeId,
      'workspace-graph__node--draggable': this.isNodeDraggable(node),
      'workspace-graph__node--expanded': this.isNodeExpanded(node),
      'workspace-graph__node--collapsed': this.isNodeExpandable(node) && !this.isNodeExpanded(node),
      'workspace-graph__node--avatar': !!node.avatarUrl,
    };
  }

  protected isNodeExpandable(node: WorkspaceGraphNode): boolean {
    return this.expandableNodeIds.includes(node.id);
  }

  protected isNodeExpanded(node: WorkspaceGraphNode): boolean {
    return this.expandedNodeIds.has(node.id);
  }

  protected nodeSize(node: WorkspaceGraphNode): string | null {
    return node.kind === 'root' ? (node.rootNodeSize ?? '7.5rem') : null;
  }

  protected nodeAccessibleLabel(node: WorkspaceGraphNode): string {
    return `${node.label}, ${this.nodeKindLabel(node)}. ${this.nodeStatusLabel(node)}. ${this.nodeRelationshipLabel(node)}. ${this.nodeActionHint(node)}.`;
  }

  protected nodeKindLabel(node: WorkspaceGraphNode): string {
    const kindLabels: Record<WorkspaceGraphNodeKind, string> = {
      root: 'Übersicht',
      domain: 'Domäne',
      page: 'Seitenbereich',
      action: 'Aktion',
      instance: 'Kunden-Instanz',
    };

    return kindLabels[node.kind];
  }

  protected nodeStatusLabel(node: WorkspaceGraphNode): string {
    const status = node.id === this.activeNodeId ? 'Aktiver Arbeitsknoten' : 'Nicht aktiv';
    const childCount = this.childNodes(node.id).length;

    if (this.isNodeExpandable(node)) {
      const expansionState = this.isNodeExpanded(node) ? 'aufgeklappt' : 'eingeklappt';

      if (childCount > 0) {
        return `${status}, ${expansionState}, ${childCount} Inhalte sichtbar`;
      }

      return `${status}, ${expansionState}`;
    }

    if (childCount > 0) {
      return `${status}, ${childCount} Inhalte sichtbar`;
    }

    return status;
  }

  protected nodeRelationshipLabel(node: WorkspaceGraphNode): string {
    const parent = this.parentNode(node);
    const children = this.childNodes(node.id);
    const relationships: string[] = [];

    if (parent) {
      relationships.push(`gehört zu ${parent.label}`);
    }

    if (children.length > 0) {
      relationships.push(`verbunden mit ${children.map((child) => child.label).join(', ')}`);
    }

    return relationships.length > 0 ? relationships.join('; ') : 'Keine sichtbaren Beziehungen';
  }

  protected nodeActionHint(node: WorkspaceGraphNode): string {
    if (this.isNodeExpandable(node)) {
      if (node.kind === 'domain') {
        return 'Click, Enter oder Space öffnet bzw. schließt Unterknoten; es wird kein separates Fenster geöffnet';
      }

      return 'Click, Enter oder Space öffnet bzw. schließt Unterknoten; funktionale Knoten können zusätzlich eine Seite oder Aktion öffnen';
    }

    if (this.isNodeDraggable(node)) {
      return 'Click, Enter oder Space aktiviert, in Custom Flex per Maus verschiebbar';
    }

    return 'Click, Enter oder Space aktiviert';
  }

  protected edgeClass(edge: WorkspaceGraphEdge): Record<string, boolean> {
    const from = this.nodeById().get(edge.from);
    const to = this.nodeById().get(edge.to);

    return {
      'workspace-graph__edge--action': from?.kind === 'action' || to?.kind === 'action',
      'workspace-graph__edge--instance': from?.kind === 'instance' || to?.kind === 'instance',
    };
  }

  protected activateNode(node: WorkspaceGraphNode, event?: Event): void {
    if (this.suppressNextClickNodeId === node.id) {
      this.suppressNextClickNodeId = null;
      return;
    }

    const connectedIds = new Set(
      this.edges
        .filter((edge) => edge.from === node.id || edge.to === node.id)
        .flatMap((edge) => [edge.from, edge.to])
        .filter((id) => id !== node.id),
    );
    const connectedNodes = this.nodes.filter((candidate) => connectedIds.has(candidate.id));

    this.nodeActivated.emit({ node, connectedNodes, sourceOrigin: this.resolveNodeOrigin(event) });
  }

  private resolveNodeOrigin(event: Event | undefined): WorkspaceGraphNodeOrigin | undefined {
    if (!(event?.currentTarget instanceof HTMLElement)) {
      return undefined;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      return undefined;
    }

    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  protected toggleLinearView(): void {
    this.showLinearView.update((isVisible) => !isVisible);
  }

  protected resetPan(): void {
    this.pan.set({ x: 0, y: 0 });
    this.fitStatusMessage.set('Ansicht zurückgesetzt.');
    this.isFitPannable.set(false);
  }

  protected resetLayout(): void {
    this.pan.set({ x: 0, y: 0 });
    this.zoom.set(1);
    this.nodePositions.set({});
    this.fitStatusMessage.set('Layout zurückgesetzt.');
    this.isFitPannable.set(false);
  }

  protected fitToView(): void {
    if (this.nodes.length === 0) {
      this.pan.set({ x: 0, y: 0 });
      this.zoom.set(1);
      this.fitStatusMessage.set('Graph konnte nicht eingepasst werden. Erneut versuchen.');
      this.isFitPannable.set(false);
      return;
    }

    const viewportElement = this.viewport?.nativeElement;
    const viewportWidth = viewportElement?.clientWidth ?? this.width;
    const viewportHeight = viewportElement?.clientHeight ?? this.height;
    const fitPadding = WorkspaceGraph.FIT_VIEWPORT_PADDING;
    const safeViewportWidth = Math.max(1, viewportWidth - fitPadding * 2);
    const safeViewportHeight = Math.max(
      1,
      viewportHeight - fitPadding - WorkspaceGraph.FIT_BOTTOM_SAFE_AREA,
    );
    const bounds = this.graphBounds();
    const boundsWidth = Math.max(1, bounds.right - bounds.left);
    const boundsHeight = Math.max(1, bounds.bottom - bounds.top);
    const fittingZoom = Math.min(
      safeViewportWidth / boundsWidth,
      safeViewportHeight / boundsHeight,
    );
    const nextZoom = Math.min(
      WorkspaceGraph.MAX_ZOOM,
      Math.max(WorkspaceGraph.MIN_READABLE_ZOOM, fittingZoom),
    );
    const isPannable = fittingZoom < WorkspaceGraph.MIN_READABLE_ZOOM;
    const boundsCenter = { x: bounds.left + boundsWidth / 2, y: bounds.top + boundsHeight / 2 };

    this.zoom.set(Number(nextZoom.toFixed(2)));
    this.pan.set({
      x: Number(((this.width / 2 - boundsCenter.x) * nextZoom).toFixed(2)),
      y: Number(((this.height / 2 - boundsCenter.y) * nextZoom).toFixed(2)),
    });
    this.isFitPannable.set(isPannable);
    this.fitStatusMessage.set(
      isPannable
        ? 'Graph ist bei lesbarer Größe größer als der sichtbare Bereich. Ziehe oder scrolle, um weitere Knoten zu sehen.'
        : 'Alle sichtbaren Knoten eingepasst.',
    );
  }

  protected zoomIn(): void {
    this.setZoom(this.zoom() + 0.1);
  }

  protected zoomOut(): void {
    this.setZoom(this.zoom() - 0.1);
  }

  protected handleWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    this.setZoom(this.zoom() + (event.deltaY < 0 ? 0.08 : -0.08));
  }

  protected beginNodeDrag(event: PointerEvent, node: WorkspaceGraphNode): void {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();

    if (!this.isNodeDraggable(node)) {
      return;
    }

    const position = this.nodePosition(node);
    this.nodeDragStart = {
      pointerId: event.pointerId,
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: position.x,
      nodeY: position.y,
      moved: false,
    };
    this.isDraggingNode.set(true);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected beginPan(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const pan = this.pan();
    this.dragStart = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    this.isPanning.set(true);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected movePan(event: PointerEvent): void {
    if (this.nodeDragStart && this.nodeDragStart.pointerId === event.pointerId) {
      const deltaX = event.clientX - this.nodeDragStart.startX;
      const deltaY = event.clientY - this.nodeDragStart.startY;
      const movedEnough = Math.hypot(deltaX, deltaY) > 4;

      if (!movedEnough && !this.nodeDragStart.moved) {
        return;
      }

      this.nodeDragStart.moved = true;
      this.nodePositions.update((positions) => ({
        ...positions,
        [this.nodeDragStart!.nodeId]: {
          x: this.nodeDragStart!.nodeX + deltaX / this.zoom(),
          y: this.nodeDragStart!.nodeY + deltaY / this.zoom(),
        },
      }));
      return;
    }

    if (!this.dragStart || this.dragStart.pointerId !== event.pointerId) {
      return;
    }

    this.pan.set({
      x: this.dragStart.panX + event.clientX - this.dragStart.startX,
      y: this.dragStart.panY + event.clientY - this.dragStart.startY,
    });
  }

  protected endPan(event: PointerEvent): void {
    if (this.nodeDragStart && this.nodeDragStart.pointerId === event.pointerId) {
      if (this.nodeDragStart.moved) {
        this.suppressNextClickNodeId = this.nodeDragStart.nodeId;
      }

      this.nodeDragStart = null;
      this.isDraggingNode.set(false);
      return;
    }

    if (!this.dragStart || this.dragStart.pointerId !== event.pointerId) {
      return;
    }

    this.dragStart = null;
    this.isPanning.set(false);
  }

  @HostListener('window:keydown.escape')
  protected handleEscape(): void {
    this.resetPan();
  }

  private setZoom(value: number): void {
    this.zoom.set(
      Math.min(
        WorkspaceGraph.MAX_ZOOM,
        Math.max(WorkspaceGraph.MIN_READABLE_ZOOM, Number(value.toFixed(2))),
      ),
    );
  }

  private graphBounds(): { left: number; right: number; top: number; bottom: number } {
    const nodeBounds = this.nodes.map((node) => {
      const position = this.nodePosition(node);
      const horizontalPadding = Math.max(
        WorkspaceGraph.FIT_NODE_RADIUS,
        WorkspaceGraph.FIT_LABEL_SAFE_WIDTH / 2,
      );
      const verticalPadding = Math.max(
        WorkspaceGraph.FIT_NODE_RADIUS,
        WorkspaceGraph.FIT_LABEL_SAFE_HEIGHT / 2,
      );

      return {
        left: position.x - horizontalPadding,
        right: position.x + horizontalPadding,
        top: position.y - verticalPadding,
        bottom: position.y + verticalPadding,
      };
    });
    const edgeBounds = this.edges
      .map((edge) => this.edgeLine(edge))
      .filter((line) => !!line)
      .map((line) => ({
        left: Math.min(line.x1, line.x2),
        right: Math.max(line.x1, line.x2),
        top: Math.min(line.y1, line.y2),
        bottom: Math.max(line.y1, line.y2),
      }));
    const bounds = [...nodeBounds, ...edgeBounds];

    return {
      left: Math.min(...bounds.map((bound) => bound.left)) - WorkspaceGraph.FIT_VIEWPORT_PADDING,
      right: Math.max(...bounds.map((bound) => bound.right)) + WorkspaceGraph.FIT_VIEWPORT_PADDING,
      top: Math.min(...bounds.map((bound) => bound.top)) - WorkspaceGraph.FIT_VIEWPORT_PADDING,
      bottom:
        Math.max(...bounds.map((bound) => bound.bottom)) + WorkspaceGraph.FIT_BOTTOM_SAFE_AREA,
    };
  }

  private buildLinearGraphNodes(): LinearGraphNode[] {
    const nodesById = this.nodeById();
    const childrenByParent = new Map<string, WorkspaceGraphNode[]>();
    this.edges.forEach((edge) => {
      const child = nodesById.get(edge.to);

      if (!child) {
        return;
      }

      childrenByParent.set(edge.from, [...(childrenByParent.get(edge.from) ?? []), child]);
    });

    const orderedNodes: LinearGraphNode[] = [];
    const visitedNodeIds = new Set<string>();
    const startNode = nodesById.get('start') ?? this.nodes[0];

    if (startNode) {
      visit(startNode, 0);
    }

    this.nodes.forEach((node) => {
      if (!visitedNodeIds.has(node.id)) {
        visit(node, 0);
      }
    });

    return orderedNodes;

    function visit(node: WorkspaceGraphNode, depth: number): void {
      if (visitedNodeIds.has(node.id)) {
        return;
      }

      visitedNodeIds.add(node.id);
      orderedNodes.push({ node, depth });
      (childrenByParent.get(node.id) ?? []).forEach((child) => visit(child, depth + 1));
    }
  }

  private childNodes(nodeId: string): WorkspaceGraphNode[] {
    const nodesById = this.nodeById();

    return this.edges
      .map((edge) => (edge.from === nodeId ? nodesById.get(edge.to) : undefined))
      .filter((node) => !!node);
  }
  private buildLinearGraphGroups(): LinearGraphGroup[] {
    const descendantsByDomain = new Map<string, LinearGraphNode[]>();
    const topLevelEntries = this.linearGraphNodes().filter(
      (entry) => this.parentEdge(entry.node)?.from === 'start',
    );

    topLevelEntries.forEach((entry) => descendantsByDomain.set(entry.node.id, []));

    this.linearGraphNodes().forEach((entry) => {
      const topLevelParent = this.topLevelParentId(entry.node);

      if (!topLevelParent || entry.node.id === topLevelParent) {
        return;
      }

      descendantsByDomain.set(topLevelParent, [
        ...(descendantsByDomain.get(topLevelParent) ?? []),
        entry,
      ]);
    });

    return topLevelEntries.map((domain) => ({
      domain,
      children: descendantsByDomain.get(domain.node.id) ?? [],
    }));
  }

  protected linearGroupLabel(group: LinearGraphGroup): string {
    const childCount = group.children.length;
    const expansionState =
      childCount > 0 ? 'aufgeklappt' : 'eingeklappt oder ohne sichtbare Kinder';
    const activeState = group.domain.node.id === this.activeNodeId ? ', aktiver Bereich' : '';

    return `${group.domain.node.label}, ${this.nodeKindLabel(group.domain.node)}, ${expansionState}, ${childCount} sichtbare Einträge${activeState}`;
  }

  protected linearChildDepth(entry: LinearGraphNode): number {
    return Math.max(1, Math.min(3, entry.depth - 1));
  }

  protected childListId(node: WorkspaceGraphNode): string {
    return `workspace-graph-linear-children-${node.id}`;
  }

  private parentNode(node: WorkspaceGraphNode): WorkspaceGraphNode | undefined {
    const parentId = this.parentEdge(node)?.from;

    return parentId ? this.nodeById().get(parentId) : undefined;
  }

  private topLevelParentId(node: WorkspaceGraphNode): string | undefined {
    let currentNode: WorkspaceGraphNode | undefined = node;

    while (currentNode) {
      const parent = this.parentNode(currentNode);

      if (parent?.id === 'start') {
        return currentNode.id;
      }

      currentNode = parent;
    }

    return undefined;
  }

  private isNodeDraggable(node: WorkspaceGraphNode): boolean {
    return !this.lockAnchoredNodesToAutoLayout && this.parentEdge(node)?.from === 'start';
  }
}

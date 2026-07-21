export type RadialGraphNode = {
  id: string;
  type?: string;
  preferredAngle?: number;
  preferredDistance?: number;
};

export type RadialGraphEdge = {
  from: string;
  to: string;
};

export type RadialPoint = {
  x: number;
  y: number;
};

export type RadialGraphLayoutOptions = {
  rootId: string;
  center?: RadialPoint;
  levelDistance?: number;
  siblingAngle?: number;
  rootStartAngle?: number;
};

export type RadialGraphLayoutPosition = RadialPoint & {
  angle: number;
  depth: number;
};

const DEFAULT_CENTER: RadialPoint = { x: 0, y: 0 };
const DEFAULT_LEVEL_DISTANCE = 170;
const DEFAULT_SIBLING_ANGLE = 32;
const DEFAULT_ROOT_START_ANGLE = 0;

export function computeRadialGraphLayout(
  nodes: RadialGraphNode[],
  edges: RadialGraphEdge[],
  options: RadialGraphLayoutOptions,
): Map<string, RadialGraphLayoutPosition> {
  const center = options.center ?? DEFAULT_CENTER;
  const levelDistance = options.levelDistance ?? DEFAULT_LEVEL_DISTANCE;
  const siblingAngle = options.siblingAngle ?? DEFAULT_SIBLING_ANGLE;
  const rootStartAngle = options.rootStartAngle ?? DEFAULT_ROOT_START_ANGLE;
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const childrenByParent = buildChildrenByParent(edges, nodeIds);
  const positions = new Map<string, RadialGraphLayoutPosition>();

  positions.set(options.rootId, { ...center, angle: rootStartAngle, depth: 0 });
  placeChildren(options.rootId, rootStartAngle, 0, true);

  return positions;

  function placeChildren(parentId: string, parentAngle: number, parentDepth: number, isRoot: boolean): void {
    const parentPosition = positions.get(parentId);
    const children = childrenByParent.get(parentId) ?? [];

    if (!parentPosition || children.length === 0) {
      return;
    }

    const childAngles = isRoot
      ? equalRootAngles(children.length, rootStartAngle)
      : symmetricChildAngles(parentAngle, children.length, siblingAngle);
    const resolvedChildAngles = resolveChildAngles(nodesById, children, childAngles);

    children.forEach((childId, index) => {
      if (positions.has(childId)) {
        return;
      }

      const child = nodesById.get(childId);
      const angle = resolvedChildAngles[index];
      const childDistance = child?.preferredDistance ?? levelDistance;
      const childPosition = pointFrom(parentPosition, angle, childDistance);
      positions.set(childId, { ...childPosition, angle, depth: parentDepth + 1 });
      placeChildren(childId, angle, parentDepth + 1, false);
    });
  }
}

function resolveChildAngles(
  nodesById: Map<string, RadialGraphNode>,
  childIds: string[],
  fallbackAngles: number[],
): number[] {
  return childIds.map((childId, index) => {
    const preferredAngle = nodesById.get(childId)?.preferredAngle;

    return preferredAngle === undefined ? fallbackAngles[index] : normalizeAngle(preferredAngle);
  });
}

export function equalRootAngles(count: number, startAngle = DEFAULT_ROOT_START_ANGLE): number[] {
  if (count <= 0) {
    return [];
  }

  const step = 360 / count;
  return Array.from({ length: count }, (_, index) => normalizeAngle(startAngle + index * step));
}

export function symmetricChildAngles(parentAngle: number, count: number, siblingAngle = DEFAULT_SIBLING_ANGLE): number[] {
  if (count <= 0) {
    return [];
  }

  const middle = (count - 1) / 2;
  return Array.from({ length: count }, (_, index) => normalizeAngle(parentAngle + (index - middle) * siblingAngle));
}

function buildChildrenByParent(edges: RadialGraphEdge[], nodeIds: Set<string>): Map<string, string[]> {
  const childrenByParent = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      return;
    }

    const children = childrenByParent.get(edge.from) ?? [];
    children.push(edge.to);
    childrenByParent.set(edge.from, children);
  });

  return childrenByParent;
}

function pointFrom(point: RadialPoint, angle: number, distance: number): RadialPoint {
  const radians = (angle * Math.PI) / 180;

  return {
    x: normalizeCoordinate(point.x + Math.cos(radians) * distance),
    y: normalizeCoordinate(point.y + Math.sin(radians) * distance),
  };
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function normalizeCoordinate(value: number): number {
  return Math.abs(value) < 1e-10 ? 0 : value;
}

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

type ChildPlacement = {
  angle: number;
  distance?: number;
};

const DEFAULT_CENTER: RadialPoint = { x: 0, y: 0 };
const DEFAULT_LEVEL_DISTANCE = 170;
const DEFAULT_SIBLING_ANGLE = 32;
const DEFAULT_ROOT_START_ANGLE = 0;
const DEFAULT_DISTANCE_BY_NODE_TYPE: Record<string, number> = {
  action: 145,
  domain: 190,
  instance: 350,
  page: 190,
};

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

    const childPlacements = isRoot
      ? equalRootAngles(children.length, rootStartAngle).map((angle) => ({ angle }))
      : topLevelChildPlacements(parentAngle, children.length, levelDistance, siblingAngle, parentDepth);
    const resolvedChildPlacements = resolveChildPlacements(nodesById, children, childPlacements);

    children.forEach((childId, index) => {
      if (positions.has(childId)) {
        return;
      }

      const child = nodesById.get(childId);
      const placement = resolvedChildPlacements[index];
      const angle = placement.angle;
      const childDistance =
        child?.preferredDistance ?? distanceForNodeType(child?.type) ?? placement.distance ?? levelDistance;
      const childPosition = pointFrom(parentPosition, angle, childDistance);
      positions.set(childId, { ...childPosition, angle, depth: parentDepth + 1 });
      placeChildren(childId, angle, parentDepth + 1, false);
    });
  }
}

function distanceForNodeType(type: string | undefined): number | undefined {
  return type ? DEFAULT_DISTANCE_BY_NODE_TYPE[type] : undefined;
}

function resolveChildPlacements(
  nodesById: Map<string, RadialGraphNode>,
  childIds: string[],
  fallbackPlacements: ChildPlacement[],
): ChildPlacement[] {
  return childIds.map((childId, index) => {
    const preferredAngle = nodesById.get(childId)?.preferredAngle;
    const fallbackPlacement = fallbackPlacements[index];

    return {
      ...fallbackPlacement,
      angle:
        preferredAngle === undefined ? fallbackPlacement.angle : normalizeAngle(preferredAngle),
    };
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

function topLevelChildPlacements(
  parentAngle: number,
  count: number,
  levelDistance: number,
  siblingAngle: number,
  parentDepth: number,
): ChildPlacement[] {
  if (parentDepth !== 1) {
    return symmetricChildAngles(parentAngle, count, siblingAngle).map((angle) => ({ angle }));
  }

  const firstRingDistance = Math.max(levelDistance, 205);
  const secondRingDistance = Math.max(firstRingDistance + 125, 330);
  const firstRingOffsets = topLevelChildAngleOffsets(Math.min(count, 7));
  const secondRingOffsets = topLevelChildAngleOffsets(count - firstRingOffsets.length).map(
    (offset) => offset + 180,
  );

  return [
    ...firstRingOffsets.map((offset) => ({
      angle: normalizeAngle(parentAngle + offset),
      distance: firstRingDistance,
    })),
    ...secondRingOffsets.map((offset) => ({
      angle: normalizeAngle(parentAngle + offset),
      distance: secondRingDistance,
    })),
  ];
}

function topLevelChildAngleOffsets(count: number): number[] {
  const offsetsByCount: Record<number, number[]> = {
    1: [0],
    2: [-50, 50],
    3: [-70, 0, 70],
    4: [-90, -30, 30, 90],
    5: [-110, -55, 0, 55, 110],
    6: [-120, -72, -24, 24, 72, 120],
    7: [-130, -88, -46, 0, 46, 88, 130],
  };

  return offsetsByCount[count] ?? [];
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

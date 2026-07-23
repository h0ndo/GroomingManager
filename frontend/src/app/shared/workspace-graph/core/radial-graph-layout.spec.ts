import { computeRadialGraphLayout } from './radial-graph-layout';

function pairwiseDistances(points: { x: number; y: number }[]): number[] {
  return points.flatMap((point, index) =>
    points.slice(index + 1).map((otherPoint) => Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y)),
  );
}

describe('computeRadialGraphLayout', () => {
  it('keeps many direct top-level children in a local collision-free child zone', () => {
    const childIds = Array.from({ length: 10 }, (_, index) => `customer-child-${index + 1}`);
    const layout = computeRadialGraphLayout(
      [{ id: 'start' }, { id: 'customers' }, ...childIds.map((id) => ({ id }))],
      [{ from: 'start', to: 'customers' }, ...childIds.map((id) => ({ from: 'customers', to: id }))],
      { rootId: 'start', center: { x: 0, y: 0 }, levelDistance: 190, siblingAngle: 32 },
    );
    const parentPosition = layout.get('customers')!;
    const childPositions = childIds.map((id) => layout.get(id)!);
    const parentDistances = childPositions.map((position) =>
      Math.hypot(position.x - parentPosition.x, position.y - parentPosition.y),
    );

    expect(parentDistances.every((distance) => distance >= 185 && distance <= 330)).toBeTrue();
    expect(Math.min(...pairwiseDistances(childPositions))).toBeGreaterThan(120);
    expect(childPositions.some((position) => position.x < parentPosition.x)).toBeTrue();
    expect(childPositions.some((position) => position.x > parentPosition.x)).toBeTrue();
    expect(childPositions.some((position) => position.y < parentPosition.y)).toBeTrue();
    expect(childPositions.some((position) => position.y > parentPosition.y)).toBeTrue();
  });

  it('places two root children horizontally with equal distance from the center', () => {
    const layout = computeRadialGraphLayout(
      [
        { id: 'start' },
        { id: 'customers' },
        { id: 'groomers' },
      ],
      [
        { from: 'start', to: 'customers' },
        { from: 'start', to: 'groomers' },
      ],
      { rootId: 'start', center: { x: 0, y: 0 }, levelDistance: 100 },
    );

    expect(layout.get('customers')).toEqual({ x: 100, y: 0, angle: 0, depth: 1 });
    expect(layout.get('groomers')).toEqual({ x: -100, y: 0, angle: 180, depth: 1 });
  });

  it('places root children at equal angles around the center', () => {
    const layout = computeRadialGraphLayout(
      [{ id: 'start' }, { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      [
        { from: 'start', to: 'a' },
        { from: 'start', to: 'b' },
        { from: 'start', to: 'c' },
        { from: 'start', to: 'd' },
      ],
      { rootId: 'start', center: { x: 0, y: 0 }, levelDistance: 100 },
    );

    expect(layout.get('a')?.angle).toBeCloseTo(0, 6);
    expect(layout.get('b')?.angle).toBeCloseTo(90, 6);
    expect(layout.get('c')?.angle).toBeCloseTo(180, 6);
    expect(layout.get('d')?.angle).toBeCloseTo(270, 6);
  });

  it('places children of a top-level node in a wider local sector around the parent', () => {
    const layout = computeRadialGraphLayout(
      [
        { id: 'start' },
        { id: 'customers' },
        { id: 'search' },
        { id: 'list' },
        { id: 'add' },
      ],
      [
        { from: 'start', to: 'customers' },
        { from: 'customers', to: 'search' },
        { from: 'customers', to: 'list' },
        { from: 'customers', to: 'add' },
      ],
      {
        rootId: 'start',
        center: { x: 0, y: 0 },
        levelDistance: 100,
        siblingAngle: 30,
      },
    );

    expect(layout.get('customers')?.angle).toBeCloseTo(0, 6);
    expect(layout.get('search')?.angle).toBeCloseTo(290, 6);
    expect(layout.get('list')?.angle).toBeCloseTo(0, 6);
    expect(layout.get('add')?.angle).toBeCloseTo(70, 6);
    expect(layout.get('list')?.x).toBeCloseTo(305, 6);
    expect(layout.get('list')?.y).toBeCloseTo(0, 6);
    expect(
      Math.hypot(
        layout.get('search')!.x - layout.get('add')!.x,
        layout.get('search')!.y - layout.get('add')!.y,
      ),
    ).toBeGreaterThan(300);
  });

  it('uses preferred angles and distances to keep an important working chain straight', () => {
    const layout = computeRadialGraphLayout(
      [
        { id: 'start' },
        { id: 'groomers', preferredAngle: 0 },
        { id: 'calendar', preferredAngle: 0, preferredDistance: 120 },
        { id: 'appointments', preferredAngle: 0, preferredDistance: 80 },
        { id: 'admin', preferredAngle: 160 },
      ],
      [
        { from: 'start', to: 'groomers' },
        { from: 'start', to: 'admin' },
        { from: 'groomers', to: 'calendar' },
        { from: 'calendar', to: 'appointments' },
      ],
      { rootId: 'start', center: { x: 0, y: 0 }, levelDistance: 100 },
    );

    expect(layout.get('groomers')).toEqual({ x: 100, y: 0, angle: 0, depth: 1 });
    expect(layout.get('calendar')).toEqual({ x: 220, y: 0, angle: 0, depth: 2 });
    expect(layout.get('appointments')).toEqual({ x: 300, y: 0, angle: 0, depth: 3 });
    expect(layout.get('admin')?.angle).toBe(160);
  });
});

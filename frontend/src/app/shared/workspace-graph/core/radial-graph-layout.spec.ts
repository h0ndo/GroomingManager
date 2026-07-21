import { computeRadialGraphLayout } from './radial-graph-layout';

describe('computeRadialGraphLayout', () => {
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

  it('places children of a non-root node symmetrically around the parent radial axis', () => {
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
    expect(layout.get('search')?.angle).toBeCloseTo(330, 6);
    expect(layout.get('list')?.angle).toBeCloseTo(0, 6);
    expect(layout.get('add')?.angle).toBeCloseTo(30, 6);
    expect(layout.get('list')?.x).toBeCloseTo(200, 6);
    expect(layout.get('list')?.y).toBeCloseTo(0, 6);
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

// @vitest-environment jsdom
// Fabric object construction needs `document` for Text measurement; jsdom
// provides it. No fabric.Canvas is used anywhere here — objects only.
import { describe, it, expect } from 'vitest';
import * as fabric from 'fabric';
import {
  renderPrimitive,
  compileFunction,
  PRIMITIVE_NAMES,
} from '../whiteboardPrimitives';

const isType = (obj: fabric.Object, type: string) => obj.type === type;
const ofType = (objs: fabric.Object[], type: string) => objs.filter((o) => isType(o, type));

// Every Line/Rect/Circle/Polyline/Polygon coordinate must stay inside the box.
function expectInsideBox(objs: fabric.Object[], box: { left: number; top: number; width: number; height: number }) {
  const eps = 1e-6;
  for (const obj of objs) {
    if (obj instanceof fabric.Line) {
      for (const [x, y] of [[obj.x1, obj.y1], [obj.x2, obj.y2]] as const) {
        expect(x).toBeGreaterThanOrEqual(box.left - eps);
        expect(x).toBeLessThanOrEqual(box.left + box.width + eps);
        expect(y).toBeGreaterThanOrEqual(box.top - eps);
        expect(y).toBeLessThanOrEqual(box.top + box.height + eps);
      }
    } else if (obj instanceof fabric.Rect) {
      expect(obj.left).toBeGreaterThanOrEqual(box.left - eps);
      expect(obj.top).toBeGreaterThanOrEqual(box.top - eps);
      expect(obj.left + obj.width).toBeLessThanOrEqual(box.left + box.width + eps);
      expect(obj.top + obj.height).toBeLessThanOrEqual(box.top + box.height + eps);
    } else if (obj instanceof fabric.Circle) {
      expect(obj.left - obj.radius).toBeGreaterThanOrEqual(box.left - eps);
      expect(obj.left + obj.radius).toBeLessThanOrEqual(box.left + box.width + eps);
      expect(obj.top - obj.radius).toBeGreaterThanOrEqual(box.top - eps);
      expect(obj.top + obj.radius).toBeLessThanOrEqual(box.top + box.height + eps);
    } else if (obj instanceof fabric.Polyline || obj instanceof fabric.Polygon) {
      for (const p of obj.points) {
        expect(p.x).toBeGreaterThanOrEqual(box.left - eps);
        expect(p.x).toBeLessThanOrEqual(box.left + box.width + eps);
        expect(p.y).toBeGreaterThanOrEqual(box.top - eps);
        expect(p.y).toBeLessThanOrEqual(box.top + box.height + eps);
      }
    } else if (obj instanceof fabric.Triangle) {
      // arrowheads: origin center, width/height extend ±half
      expect(obj.left - obj.width / 2).toBeGreaterThanOrEqual(box.left - 1);
      expect(obj.left + obj.width / 2).toBeLessThanOrEqual(box.left + box.width + 1);
    } else if (obj instanceof fabric.Text) {
      // Text origin is center; position must be inside the box.
      expect(obj.left).toBeGreaterThanOrEqual(box.left - eps);
      expect(obj.left).toBeLessThanOrEqual(box.left + box.width + eps);
      expect(obj.top).toBeGreaterThanOrEqual(box.top - eps);
      expect(obj.top).toBeLessThanOrEqual(box.top + box.height + eps);
    }
  }
}

describe('compileFunction', () => {
  it('evaluates polynomials', () => {
    const f = compileFunction('2x^2 - 3x + 1')!;
    expect(f).not.toBeNull();
    expect(f(2)).toBeCloseTo(2 * 4 - 6 + 1, 9);
    expect(f(0)).toBeCloseTo(1, 9);
  });

  it('respects ^ right-associativity and precedence', () => {
    expect(compileFunction('2^3^2')!(0)).toBe(512); // 2^(3^2), not (2^3)^2
    expect(compileFunction('2+3*4')!(0)).toBe(14);
    expect(compileFunction('-x^2')!(3)).toBe(-9); // unary minus under ^
  });

  it('handles implicit multiplication', () => {
    expect(compileFunction('2x')!(4)).toBe(8);
    expect(compileFunction('2(x+1)')!(3)).toBe(8);
    expect(compileFunction('(x+1)(x-1)')!(3)).toBe(8);
  });

  it('supports sin/cos/tan', () => {
    expect(compileFunction('sin(x)')!(Math.PI / 2)).toBeCloseTo(1, 9);
    expect(compileFunction('cos(x)')!(0)).toBeCloseTo(1, 9);
    expect(compileFunction('tan(x)')!(Math.PI / 4)).toBeCloseTo(1, 9);
  });

  it('rejects invalid expressions', () => {
    expect(compileFunction('')).toBeNull();
    expect(compileFunction('2 +')).toBeNull();
    expect(compileFunction('foo(x)')).toBeNull();
    expect(compileFunction('x & 1')).toBeNull();
    expect(compileFunction('(x+1')).toBeNull();
  });
});

describe('renderPrimitive safety', () => {
  it('returns [] for an unknown name and never throws', () => {
    expect(renderPrimitive('nonsense', { left: 0, top: 0, width: 10, height: 10 })).toEqual([]);
  });

  it('returns [] for garbage params and never throws', () => {
    expect(renderPrimitive('axes', {})).toEqual([]);
    expect(renderPrimitive('fractionBar', { left: 0, top: 0, width: 100, height: 50, numerator: 1, denominator: 0 })).toEqual([]);
    expect(renderPrimitive('functionPlot', { left: 0, top: 0, width: 100, height: 100, fn: 'eval(' })).toEqual([]);
    expect(renderPrimitive('tableGrid', { left: 0, top: 0, width: 100, height: 100, rows: 'nope' })).toEqual([]);
    // @ts-expect-error — runtime misuse must not throw either
    expect(renderPrimitive('axes', null)).toEqual([]);
  });

  it('exposes the six catalog names', () => {
    expect(PRIMITIVE_NAMES.sort()).toEqual(
      ['axes', 'fractionBar', 'functionPlot', 'numberLine', 'tableGrid', 'triangleFigure'].sort()
    );
  });
});

describe('axes', () => {
  const box = { left: 100, top: 50, width: 400, height: 300 };

  it('draws two axis lines crossing at the data origin', () => {
    const objs = renderPrimitive('axes', box);
    const lines = ofType(objs, 'line') as fabric.Line[];
    // x-axis: horizontal through y=0 → vertical center of [-5,5]; the arrow
    // tip is inset by the head length (12) so the head stays in the box.
    const xAxis = lines.find((l) => l.y1 === l.y2 && l.x2 - l.x1 === box.width - 12);
    expect(xAxis).toBeDefined();
    expect(xAxis!.y1).toBeCloseTo(box.top + box.height / 2, 6);
    // y-axis: vertical through x=0 → horizontal center of [-5,5]
    const yAxis = lines.find((l) => l.x1 === l.x2 && l.y1 - l.y2 === box.height - 12);
    expect(yAxis).toBeDefined();
    expect(yAxis!.x1).toBeCloseTo(box.left + box.width / 2, 6);
    expectInsideBox(objs, box);
  });

  it('places tick marks at correct data positions', () => {
    const objs = renderPrimitive('axes', { ...box, xMin: -4, xMax: 4, yMin: -2, yMax: 6 });
    const lines = ofType(objs, 'line') as fabric.Line[];
    // x tick at v=3: px = left + (3-(-4))/8 * width = 100 + 7/8*400 = 450
    const tick = lines.find((l) => l.x1 === l.x2 && Math.abs(l.y1 - l.y2) === 8 && Math.abs(l.x1 - 450) < 1e-6);
    expect(tick).toBeDefined();
  });

  it('clamps the x-axis to the box edge when 0 is out of range', () => {
    const objs = renderPrimitive('axes', { ...box, yMin: 1, yMax: 5 });
    const lines = ofType(objs, 'line') as fabric.Line[];
    const xAxis = lines.find((l) => l.y1 === l.y2 && l.x2 - l.x1 === box.width - 12);
    expect(xAxis!.y1).toBeCloseTo(box.top + box.height, 6);
    expectInsideBox(objs, box);
  });

  it('rejects inverted ranges', () => {
    expect(renderPrimitive('axes', { ...box, xMin: 5, xMax: -5 })).toEqual([]);
  });
});

describe('functionPlot', () => {
  const box = { left: 0, top: 0, width: 500, height: 500 };

  it('plots x^2 with all points satisfying |y - x²| ≤ ε after axis mapping', () => {
    const params = { ...box, fn: 'x^2', xMin: -5, xMax: 5, yMin: -1, yMax: 26 };
    const objs = renderPrimitive('functionPlot', params);
    expect(objs).toHaveLength(1);
    const poly = objs[0] as fabric.Polyline;
    expect(isType(poly, 'polyline')).toBe(true);
    expect(poly.points).toHaveLength(100);
    const pxToX = (px: number) => -5 + (px / box.width) * 10;
    const pyToY = (py: number) => -1 + (1 - py / box.height) * 27;
    for (const p of poly.points) {
      const x = pxToX(p.x);
      expect(Math.abs(pyToY(p.y) - x * x)).toBeLessThanOrEqual(1e-6);
    }
  });

  it('clamps out-of-range y values to the box', () => {
    const params = { ...box, fn: 'x^2', xMin: -5, xMax: 5, yMin: -2, yMax: 2 };
    const objs = renderPrimitive('functionPlot', params);
    const poly = objs[0] as fabric.Polyline;
    expect(poly.points.length).toBeGreaterThan(1);
    for (const p of poly.points) {
      expect(p.y).toBeGreaterThanOrEqual(box.top);
      expect(p.y).toBeLessThanOrEqual(box.top + box.height);
    }
  });

  it('skips non-finite samples (1/x has an asymptote at 0) and still plots', () => {
    const objs = renderPrimitive('functionPlot', { ...box, fn: '1/x', xMin: -5, xMax: 5 });
    expect(objs).toHaveLength(1);
    const poly = objs[0] as fabric.Polyline;
    for (const p of poly.points) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('returns [] for an invalid fn', () => {
    expect(renderPrimitive('functionPlot', { ...box, fn: '2 +' })).toEqual([]);
    expect(renderPrimitive('functionPlot', { ...box, fn: 42 })).toEqual([]);
  });

  it('honors the color param', () => {
    const objs = renderPrimitive('functionPlot', { ...box, fn: 'x', color: '#16a34a' });
    expect((objs[0] as fabric.Polyline).stroke).toBe('#16a34a');
  });
});

describe('numberLine', () => {
  it('maps min/max to the box edges and dots to mark positions', () => {
    const box = { left: 50, top: 100, width: 400 };
    const objs = renderPrimitive('numberLine', { ...box, min: 0, max: 10, marks: [3, 7] });
    const lines = ofType(objs, 'line') as fabric.Line[];
    // Spine is inset one dot-radius (6px) from the top edge so dots fit.
    const spine = lines.find((l) => l.y1 === l.y2 && l.x2 - l.x1 === 400);
    expect(spine).toBeDefined();
    expect(spine!.x1).toBe(50);
    expect(spine!.y1).toBe(106);

    const dots = ofType(objs, 'circle') as fabric.Circle[];
    expect(dots).toHaveLength(2);
    // v=3 → 50 + 3/10*400 = 170 ; v=7 → 50 + 7/10*400 = 330
    expect(dots.map((d) => d.left).sort((a, b) => a - b)).toEqual([170, 330]);
    for (const d of dots) expect(d.top).toBe(106);
    expectInsideBox(objs, { ...box, height: 40 });
  });

  it('ignores out-of-range marks and rejects min ≥ max', () => {
    const objs = renderPrimitive('numberLine', { left: 0, top: 0, width: 100, min: 0, max: 5, marks: [9, -1, 2] });
    expect(ofType(objs, 'circle')).toHaveLength(1);
    expect(renderPrimitive('numberLine', { left: 0, top: 0, width: 100, min: 5, max: 5 })).toEqual([]);
  });
});

describe('fractionBar', () => {
  it('3/4 → exactly 4 cells, first 3 shaded, label "3/4"', () => {
    const box = { left: 10, top: 20, width: 400, height: 100 };
    const objs = renderPrimitive('fractionBar', { ...box, numerator: 3, denominator: 4 });
    const cells = ofType(objs, 'rect') as fabric.Rect[];
    expect(cells).toHaveLength(4);
    const shaded = cells.filter((c) => c.fill !== 'transparent');
    expect(shaded).toHaveLength(3);
    // Shaded cells are the first three, each exactly 1/4 of the bar width.
    shaded.forEach((c, i) => {
      expect(c.width).toBeCloseTo(100, 6);
      expect(c.left).toBeCloseTo(10 + i * 100, 6);
      expect(c.top).toBe(20);
    });
    const label = ofType(objs, 'text') as fabric.Text[];
    expect(label).toHaveLength(1);
    expect(label[0].text).toBe('3/4');
    expectInsideBox(objs, box);
  });

  it('uses the color param for shading', () => {
    const objs = renderPrimitive('fractionBar', {
      left: 0, top: 0, width: 200, height: 80, numerator: 1, denominator: 2, color: '#ea580c',
    });
    const shaded = (ofType(objs, 'rect') as fabric.Rect[]).filter((c) => c.fill !== 'transparent');
    expect(shaded[0].fill).toBe('#ea580c');
  });

  it('rejects denominator 0, denominator > 12, and numerator > denominator', () => {
    const base = { left: 0, top: 0, width: 200, height: 80 };
    expect(renderPrimitive('fractionBar', { ...base, numerator: 1, denominator: 0 })).toEqual([]);
    expect(renderPrimitive('fractionBar', { ...base, numerator: 1, denominator: 13 })).toEqual([]);
    expect(renderPrimitive('fractionBar', { ...base, numerator: 4, denominator: 3 })).toEqual([]);
    expect(renderPrimitive('fractionBar', { ...base, numerator: 1.5, denominator: 4 })).toEqual([]);
  });

  it('allows numerator 0 (nothing shaded) and numerator = denominator (all shaded)', () => {
    const base = { left: 0, top: 0, width: 200, height: 80 };
    const none = renderPrimitive('fractionBar', { ...base, numerator: 0, denominator: 5 });
    expect(ofType(none, 'rect')).toHaveLength(5);
    expect((ofType(none, 'rect') as fabric.Rect[]).every((c) => c.fill === 'transparent')).toBe(true);
    const all = renderPrimitive('fractionBar', { ...base, numerator: 5, denominator: 5 });
    expect((ofType(all, 'rect') as fabric.Rect[]).every((c) => c.fill !== 'transparent')).toBe(true);
  });
});

describe('triangleFigure', () => {
  const box = { left: 100, top: 50, width: 300, height: 200 };

  it('draws a triangle with apex top-center and base on the bottom edge', () => {
    const objs = renderPrimitive('triangleFigure', box);
    const polys = ofType(objs, 'polygon') as fabric.Polygon[];
    expect(polys).toHaveLength(1);
    expect(polys[0].points).toEqual([
      { x: 250, y: 50 },
      { x: 100, y: 250 },
      { x: 400, y: 250 },
    ]);
    expectInsideBox(objs, box);
  });

  it('emits angle and side labels inside the box', () => {
    const objs = renderPrimitive('triangleFigure', {
      ...box,
      labels: { angles: ['A', 'B', 'C'], sides: ['a', 'b', 'c'] },
    });
    const texts = ofType(objs, 'text') as fabric.Text[];
    expect(texts.map((t) => t.text)).toEqual(['A', 'B', 'C', 'a', 'b', 'c']);
    expectInsideBox(objs, box);
  });

  it('works without labels', () => {
    const objs = renderPrimitive('triangleFigure', box);
    expect(ofType(objs, 'polygon')).toHaveLength(1);
    expect(ofType(objs, 'text')).toHaveLength(0);
  });
});

describe('tableGrid', () => {
  it('tiles the box with rows × cols cells and centered texts', () => {
    const box = { left: 0, top: 0, width: 300, height: 100 };
    const objs = renderPrimitive('tableGrid', {
      ...box,
      rows: [
        ['x', '1', '2'],
        ['f(x)', '3', '4'],
      ],
    });
    const rects = ofType(objs, 'rect') as fabric.Rect[];
    expect(rects).toHaveLength(6);
    expect(rects[0].width).toBeCloseTo(100, 6);
    expect(rects[0].height).toBeCloseTo(50, 6);
    const texts = ofType(objs, 'text') as fabric.Text[];
    expect(texts).toHaveLength(6);
    // Cell (0,0) text is centered in the first cell.
    const first = texts.find((t) => t.text === 'x')!;
    expect(first.left).toBeCloseTo(50, 6);
    expect(first.top).toBeCloseTo(25, 6);
    expectInsideBox(objs, box);
  });

  it('auto-shrinks the font for long cell content', () => {
    const box = { left: 0, top: 0, width: 120, height: 60 };
    const small = renderPrimitive('tableGrid', { ...box, rows: [['a very long header label', 'x']] });
    const big = renderPrimitive('tableGrid', { ...box, rows: [['a', 'x']] });
    const fontOf = (objs: fabric.Object[]) => (ofType(objs, 'text')[0] as fabric.Text).fontSize;
    expect(fontOf(small)).toBeLessThan(fontOf(big)!);
    expect(fontOf(small)).toBeGreaterThanOrEqual(8);
  });

  it('pads ragged rows and rejects non-array rows', () => {
    const objs = renderPrimitive('tableGrid', { left: 0, top: 0, width: 100, height: 50, rows: [['a', 'b'], ['c']] });
    expect(ofType(objs, 'rect')).toHaveLength(4);
    expect(renderPrimitive('tableGrid', { left: 0, top: 0, width: 100, height: 50, rows: [] })).toEqual([]);
    expect(renderPrimitive('tableGrid', { left: 0, top: 0, width: 100, height: 50, rows: ['nope'] })).toEqual([]);
  });
});

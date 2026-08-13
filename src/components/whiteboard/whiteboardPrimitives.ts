import * as fabric from 'fabric';

// Whiteboard visual primitives: parametrized, always-correct composite figures
// (axes, plots, number lines, ...) the AI composes by name + params instead of
// hand-placing raw shapes. `renderPrimitive` NEVER throws — an unknown name or
// invalid params yields an empty array (plus a console.warn). Every coordinate
// a primitive emits stays inside its bounding box.

export interface PrimitiveBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

const AXIS_COLOR = '#374151';
const TICK_LABEL_COLOR = '#6b7280';
const DEFAULT_PLOT_COLOR = '#7c3aed';
const DEFAULT_SHADE_COLOR = '#3b82f6';
const DEFAULT_MARK_COLOR = '#dc2626';
const STROKE_COLOR = '#000000';

// ---------------------------------------------------------------------------
// Param validation helpers (pure — exported for tests)
// ---------------------------------------------------------------------------

function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function asBox(params: Record<string, unknown>, defaultHeight?: number): PrimitiveBox | null {
  const left = asNumber(params.left);
  const top = asNumber(params.top);
  const width = asNumber(params.width);
  const height = asNumber(params.height) ?? defaultHeight ?? null;
  if (left === null || top === null || width === null || height === null) return null;
  if (width <= 0 || height <= 0) return null;
  return { left, top, width, height };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ---------------------------------------------------------------------------
// Function expression parser (recursive-descent style: tokenize →
// shunting-yard → RPN evaluator). eval / new Function are forbidden here.
// Supports: numbers, x, + - * / ^ (right-assoc), unary minus, parentheses,
// implicit multiplication (2x, 2(x+1)), and sin/cos/tan.
// ---------------------------------------------------------------------------

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'var' }
  | { kind: 'func'; name: string }
  | { kind: 'op'; op: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

const FN_FUNCTIONS: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
};

function tokenizeFn(src: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i;
      let seenDot = false;
      while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) {
        if (src[j] === '.') {
          if (seenDot) return null;
          seenDot = true;
        }
        j++;
      }
      const value = Number(src.slice(i, j));
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: 'num', value });
      i = j;
      continue;
    }
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
      let j = i;
      while (j < src.length && ((src[j] >= 'a' && src[j] <= 'z') || (src[j] >= 'A' && src[j] <= 'Z'))) j++;
      const name = src.slice(i, j).toLowerCase();
      if (name === 'x') tokens.push({ kind: 'var' });
      // Own-property check: `in` would also match prototype members
      // (constructor, toString, __proto__, ...), violating the whitelist.
      else if (Object.prototype.hasOwnProperty.call(FN_FUNCTIONS, name)) tokens.push({ kind: 'func', name });
      else return null; // unknown identifier
      i = j;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      tokens.push({ kind: 'op', op: ch });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i++;
      continue;
    }
    return null; // unsupported character
  }

  // Insert implicit multiplication: "2x", "2(x+1)", "(x+1)(x-1)", "x sin(x)".
  // A function name directly followed by '(' is a call, not multiplication.
  const out: Token[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const cur = tokens[k];
    const next = tokens[k + 1];
    out.push(cur);
    if (!next) continue;
    const curIsValue = cur.kind === 'num' || cur.kind === 'var' || cur.kind === 'rparen';
    const nextOpens = next.kind === 'num' || next.kind === 'var' || next.kind === 'lparen';
    const isCall = cur.kind === 'func' && next.kind === 'lparen';
    const nextIsFuncValue = next.kind === 'func';
    if (!isCall && ((curIsValue && nextOpens) || (curIsValue && nextIsFuncValue))) {
      out.push({ kind: 'op', op: '*' });
    }
  }
  return out;
}

// Shunting-yard → RPN. Returns null on malformed input.
function toRpn(tokens: Token[]): Token[] | null {
  const output: Token[] = [];
  const stack: Token[] = [];
  // Unary minus sits below ^ (so -x^2 = -(x^2)) but above * / (so -2x = (-2)x).
  const prec = (op: string) => (op === 'u-' ? 3 : op === '^' ? 4 : op === '*' || op === '/' ? 3 : 2);
  const rightAssoc = (op: string) => op === '^' || op === 'u-';

  // Mark unary +/- (at start, after '(', or after another operator).
  const marked: Token[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.kind === 'op' && (t.op === '-' || t.op === '+')) {
      const prev = tokens[k - 1];
      const unary = !prev || prev.kind === 'op' || prev.kind === 'lparen' || prev.kind === 'func';
      if (unary) {
        if (t.op === '-') marked.push({ kind: 'op', op: 'u-' });
        continue; // unary '+' is a no-op
      }
    }
    marked.push(t);
  }

  for (const t of marked) {
    if (t.kind === 'num' || t.kind === 'var') {
      output.push(t);
    } else if (t.kind === 'func') {
      stack.push(t);
    } else if (t.kind === 'op') {
      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.kind === 'func') {
          output.push(stack.pop()!);
          continue;
        }
        if (top.kind !== 'op') break;
        if (prec(top.op) > prec(t.op) || (prec(top.op) === prec(t.op) && !rightAssoc(t.op))) {
          output.push(stack.pop()!);
        } else break;
      }
      stack.push(t);
    } else if (t.kind === 'lparen') {
      stack.push(t);
    } else {
      // rparen
      let found = false;
      while (stack.length > 0) {
        const top = stack.pop()!;
        if (top.kind === 'lparen') {
          found = true;
          break;
        }
        output.push(top);
      }
      if (!found) return null; // mismatched parens
      if (stack.length > 0 && stack[stack.length - 1].kind === 'func') {
        output.push(stack.pop()!);
      }
    }
  }
  while (stack.length > 0) {
    const top = stack.pop()!;
    if (top.kind === 'lparen') return null; // mismatched parens
    output.push(top);
  }
  return output;
}

// Compile a function expression into an evaluator, or null when invalid.
// Pure — exported so tests can assert on the parser directly.
export function compileFunction(src: string): ((x: number) => number) | null {
  if (typeof src !== 'string' || src.trim().length === 0 || src.length > 200) return null;
  const tokens = tokenizeFn(src.trim());
  if (!tokens || tokens.length === 0) return null;
  const rpn = toRpn(tokens);
  if (!rpn) return null;

  // Static arity check: rejects operand/operator imbalances like "2 +" that a
  // NaN probe would silently wave through.
  let depth = 0;
  for (const t of rpn) {
    if (t.kind === 'num' || t.kind === 'var') depth++;
    else if (t.kind === 'op' && t.op === 'u-') {
      if (depth < 1) return null;
    } else if (t.kind === 'func') {
      if (depth < 1) return null;
    } else if (t.kind === 'op') {
      if (depth < 2) return null;
      depth--;
    } else return null;
  }
  if (depth !== 1) return null;

  const evaluator = (x: number): number => {
    const stack: number[] = [];
    for (const t of rpn) {
      if (t.kind === 'num') stack.push(t.value);
      else if (t.kind === 'var') stack.push(x);
      else if (t.kind === 'func') {
        const v = stack.pop();
        if (v === undefined) return NaN;
        stack.push(FN_FUNCTIONS[t.name](v));
      } else if (t.kind === 'op') {
        if (t.op === 'u-') {
          const v = stack.pop();
          if (v === undefined) return NaN;
          stack.push(-v);
        } else {
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) return NaN;
          switch (t.op) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/': stack.push(a / b); break;
            case '^': stack.push(Math.pow(a, b)); break;
            default: return NaN;
          }
        }
      } else return NaN;
    }
    return stack.length === 1 ? stack[0] : NaN;
  };

  // The arity check guarantees a well-formed stack machine; domain NaNs
  // (asymptotes, 0/0) are skipped per-sample by the plotter.
  return evaluator;
}

// ---------------------------------------------------------------------------
// Shared drawing helpers
// ---------------------------------------------------------------------------

function makeText(
  text: string,
  left: number,
  top: number,
  options: Partial<fabric.TextProps> = {}
): fabric.Text {
  return new fabric.Text(text, {
    left,
    top,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fill: STROKE_COLOR,
    originX: 'center',
    originY: 'center',
    ...options,
  });
}

// Axis value ↔ pixel mapping for a bounding box + data range.
export interface AxisMapping {
  xToPx: (x: number) => number;
  yToPx: (y: number) => number;
  pxToX: (px: number) => number;
  pyToY: (py: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  box: PrimitiveBox;
}

function makeAxisMapping(box: PrimitiveBox, xMin: number, xMax: number, yMin: number, yMax: number): AxisMapping {
  const xToPx = (x: number) => box.left + ((x - xMin) / (xMax - xMin)) * box.width;
  const yToPx = (y: number) => box.top + (1 - (y - yMin) / (yMax - yMin)) * box.height;
  return {
    xToPx,
    yToPx,
    pxToX: (px: number) => xMin + ((px - box.left) / box.width) * (xMax - xMin),
    pyToY: (py: number) => yMin + (1 - (py - box.top) / box.height) * (yMax - yMin),
    xMin,
    xMax,
    yMin,
    yMax,
    box,
  };
}

// Pick a "nice" integer tick step so there are at most ~12 ticks.
function tickStep(range: number): number {
  return Math.max(1, Math.ceil(range / 12));
}

// Flat (ungrouped) arrow: shaft line + triangular head. Both objects carry
// absolute coordinates so tests can assert geometry directly.
function pushArrow(
  out: fabric.Object[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  strokeWidth = 2,
  headLen = 12
): void {
  out.push(new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth }));
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
  out.push(
    new fabric.Triangle({
      left: x2,
      top: y2,
      originX: 'center',
      originY: 'center',
      angle,
      width: headLen,
      height: headLen,
      fill: color,
    })
  );
}

// ---------------------------------------------------------------------------
// Primitive: axes — two arrowed axis lines + tick marks + labels
// ---------------------------------------------------------------------------

function renderAxes(params: Record<string, unknown>): fabric.Object[] {
  const box = asBox(params);
  if (!box) return [];
  const xMin = asNumber(params.xMin) ?? -5;
  const xMax = asNumber(params.xMax) ?? 5;
  const yMin = asNumber(params.yMin) ?? -5;
  const yMax = asNumber(params.yMax) ?? 5;
  if (!(xMin < xMax) || !(yMin < yMax)) return [];
  const xLabel = asString(params.xLabel) ?? 'x';
  const yLabel = asString(params.yLabel) ?? 'y';

  const m = makeAxisMapping(box, xMin, xMax, yMin, yMax);
  const out: fabric.Object[] = [];

  // Axis positions: at data 0 when 0 is in range, else clamped to the box edge.
  const xAxisPy = clamp(m.yToPx(0), box.top, box.top + box.height);
  const yAxisPx = clamp(m.xToPx(0), box.left, box.left + box.width);

  // Arrow tips are inset by the head length so the whole head stays in the box.
  pushArrow(out, box.left, xAxisPy, box.left + box.width - 12, xAxisPy, AXIS_COLOR);
  pushArrow(out, yAxisPx, box.top + box.height, yAxisPx, box.top + 12, AXIS_COLOR);

  // Tick marks + numeric labels. Ticks and labels point inward when the axis
  // sits on a box edge so they never leave the bounding box.
  const xLabelsBelow = xAxisPy + 16 <= box.top + box.height;
  const yLabelsRight = yAxisPx + 18 <= box.left + box.width;
  const xTickInward = xAxisPy + 4 > box.top + box.height; // axis on bottom edge
  const xTickOutward = xAxisPy - 4 < box.top; // axis on top edge
  const yTickInward = yAxisPx + 4 > box.left + box.width; // axis on right edge
  const yTickOutward = yAxisPx - 4 < box.left; // axis on left edge

  const xStep = tickStep(xMax - xMin);
  for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
    if (v === 0) continue;
    const px = m.xToPx(v);
    const y1 = xTickInward ? xAxisPy - 8 : xTickOutward ? xAxisPy : xAxisPy - 4;
    const y2 = xTickInward ? xAxisPy : xTickOutward ? xAxisPy + 8 : xAxisPy + 4;
    out.push(new fabric.Line([px, y1, px, y2], { stroke: AXIS_COLOR, strokeWidth: 1 }));
    out.push(
      makeText(String(v), px, xLabelsBelow ? xAxisPy + 14 : xAxisPy - 14, {
        fontSize: 11,
        fill: TICK_LABEL_COLOR,
      })
    );
  }

  const yStep = tickStep(yMax - yMin);
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
    if (v === 0) continue;
    const py = m.yToPx(v);
    const x1 = yTickInward ? yAxisPx - 8 : yTickOutward ? yAxisPx : yAxisPx - 4;
    const x2 = yTickInward ? yAxisPx : yTickOutward ? yAxisPx + 8 : yAxisPx + 4;
    out.push(new fabric.Line([x1, py, x2, py], { stroke: AXIS_COLOR, strokeWidth: 1 }));
    out.push(
      makeText(String(v), yLabelsRight ? yAxisPx + 16 : yAxisPx - 16, py, {
        fontSize: 11,
        fill: TICK_LABEL_COLOR,
      })
    );
  }

  // Axis names at the arrowed ends, kept inside the box.
  out.push(
    makeText(xLabel, box.left + box.width - 10, xLabelsBelow ? xAxisPy + 14 : xAxisPy - 14, {
      fontSize: 14,
      fontWeight: 'bold',
      fill: AXIS_COLOR,
    })
  );
  out.push(
    makeText(yLabel, yLabelsRight ? yAxisPx + 16 : yAxisPx - 16, box.top + 12, {
      fontSize: 14,
      fontWeight: 'bold',
      fill: AXIS_COLOR,
    })
  );

  return out;
}

// ---------------------------------------------------------------------------
// Primitive: functionPlot — axes params + { fn, color? } → Polyline segments
// (the plot breaks at non-finite samples so asymptotes draw no joining line)
// ---------------------------------------------------------------------------

const PLOT_SAMPLES = 100;

function renderFunctionPlot(params: Record<string, unknown>): fabric.Object[] {
  const box = asBox(params);
  if (!box) return [];
  const fnSrc = asString(params.fn);
  if (!fnSrc) return [];
  const fn = compileFunction(fnSrc);
  if (!fn) return [];
  const xMin = asNumber(params.xMin) ?? -5;
  const xMax = asNumber(params.xMax) ?? 5;
  const yMin = asNumber(params.yMin) ?? -5;
  const yMax = asNumber(params.yMax) ?? 5;
  if (!(xMin < xMax) || !(yMin < yMax)) return [];
  const color = asString(params.color) ?? DEFAULT_PLOT_COLOR;

  const m = makeAxisMapping(box, xMin, xMax, yMin, yMax);
  // Non-finite samples (asymptotes, e.g. 1/x or tan(x)) break the plot into
  // separate segments so no spurious near-vertical line spans the gap.
  const segments: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  for (let i = 0; i < PLOT_SAMPLES; i++) {
    const x = xMin + (i / (PLOT_SAMPLES - 1)) * (xMax - xMin);
    const y = fn(x);
    if (!Number.isFinite(y)) {
      if (current.length > 0) segments.push(current);
      current = [];
      continue;
    }
    current.push({ x: m.xToPx(x), y: clamp(m.yToPx(y), box.top, box.top + box.height) });
  }
  if (current.length > 0) segments.push(current);

  return segments
    .filter((points) => points.length >= 2)
    .map(
      (points) =>
        new fabric.Polyline(points, {
          stroke: color,
          strokeWidth: 2.5,
          fill: 'transparent',
        })
    );
}

// ---------------------------------------------------------------------------
// Primitive: numberLine — line + integer ticks + dots at marks
// ---------------------------------------------------------------------------

function renderNumberLine(params: Record<string, unknown>): fabric.Object[] {
  const box = asBox(params, 40);
  if (!box) return [];
  const min = asNumber(params.min);
  const max = asNumber(params.max);
  if (min === null || max === null || !(min < max)) return [];

  const out: fabric.Object[] = [];
  // Spine sits one dot-radius inside the box so mark dots never overflow the top.
  const linePy = box.top + 6;
  const toPx = (v: number) => box.left + ((v - min) / (max - min)) * box.width;

  out.push(
    new fabric.Line([box.left, linePy, box.left + box.width, linePy], {
      stroke: AXIS_COLOR,
      strokeWidth: 2,
    })
  );

  const step = tickStep(max - min);
  const labelsFit = linePy + 24 <= box.top + box.height;
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    const px = toPx(v);
    out.push(new fabric.Line([px, linePy, px, linePy + 6], { stroke: AXIS_COLOR, strokeWidth: 1 }));
    if (labelsFit) {
      out.push(makeText(String(v), px, linePy + 16, { fontSize: 11, fill: TICK_LABEL_COLOR }));
    }
  }

  if (Array.isArray(params.marks)) {
    for (const mark of params.marks) {
      const v = asNumber(mark);
      if (v === null || v < min || v > max) continue;
      out.push(
        new fabric.Circle({
          left: toPx(v),
          top: linePy,
          originX: 'center',
          originY: 'center',
          radius: 5,
          fill: DEFAULT_MARK_COLOR,
        })
      );
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Primitive: fractionBar — denominator cells, first numerator shaded, n/d label
// ---------------------------------------------------------------------------

function renderFractionBar(params: Record<string, unknown>): fabric.Object[] {
  const box = asBox(params);
  if (!box) return [];
  const numerator = asNumber(params.numerator);
  const denominator = asNumber(params.denominator);
  if (
    numerator === null ||
    denominator === null ||
    !Number.isInteger(numerator) ||
    !Number.isInteger(denominator) ||
    denominator < 1 ||
    denominator > 12 ||
    numerator < 0 ||
    numerator > denominator
  ) {
    return [];
  }
  const color = asString(params.color) ?? DEFAULT_SHADE_COLOR;

  const out: fabric.Object[] = [];
  // Reserve the bottom of the box for the n/d label so it stays inside the box.
  const labelBand = Math.min(24, box.height * 0.3);
  const barHeight = box.height - labelBand;
  const cellWidth = box.width / denominator;

  // The stroked cells tile the bar exactly — together they form the outer rect.
  for (let i = 0; i < denominator; i++) {
    out.push(
      new fabric.Rect({
        left: box.left + i * cellWidth,
        top: box.top,
        width: cellWidth,
        height: barHeight,
        fill: i < numerator ? color : 'transparent',
        stroke: STROKE_COLOR,
        strokeWidth: 1.5,
      })
    );
  }

  out.push(
    makeText(`${numerator}/${denominator}`, box.left + box.width / 2, box.top + barHeight + labelBand / 2, {
      fontSize: Math.min(16, labelBand * 0.7),
      fontWeight: 'bold',
    })
  );

  return out;
}

// ---------------------------------------------------------------------------
// Primitive: triangleFigure — triangle polygon + angle/side labels
// ---------------------------------------------------------------------------

function renderTriangleFigure(params: Record<string, unknown>): fabric.Object[] {
  const box = asBox(params);
  if (!box) return [];

  // Apex top-center, base along the bottom edge.
  const A = { x: box.left + box.width / 2, y: box.top };
  const B = { x: box.left, y: box.top + box.height };
  const C = { x: box.left + box.width, y: box.top + box.height };
  const centroid = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };

  const out: fabric.Object[] = [
    new fabric.Polygon([A, B, C], {
      fill: 'transparent',
      stroke: STROKE_COLOR,
      strokeWidth: 2,
    }),
  ];

  const labels = (params.labels ?? {}) as Record<string, unknown>;
  const angles = Array.isArray(labels.angles) ? labels.angles : [];
  const sides = Array.isArray(labels.sides) ? labels.sides : [];

  // Label placed on the segment vertex→centroid, `offset` px from the vertex —
  // guaranteed inside the triangle (and therefore inside the box).
  const inward = (p: { x: number; y: number }, offset: number) => {
    const dx = centroid.x - p.x;
    const dy = centroid.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / len) * offset, y: p.y + (dy / len) * offset };
  };

  const vertices = [A, B, C];
  for (let i = 0; i < 3; i++) {
    const label = asString(angles[i]);
    if (!label) continue;
    const pos = inward(vertices[i], 22);
    out.push(makeText(label, pos.x, pos.y, { fontSize: 14 }));
  }

  // Side a = BC (opposite A), side b = CA, side c = AB.
  const midpoints = [
    { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 },
    { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 },
    { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 },
  ];
  for (let i = 0; i < 3; i++) {
    const label = asString(sides[i]);
    if (!label) continue;
    const pos = inward(midpoints[i], 18);
    out.push(makeText(label, pos.x, pos.y, { fontSize: 14, fill: '#1e40af' }));
  }

  return out;
}

// ---------------------------------------------------------------------------
// Primitive: tableGrid — rect grid + cell texts, font auto-shrinks to fit
// ---------------------------------------------------------------------------

function renderTableGrid(params: Record<string, unknown>): fabric.Object[] {
  const box = asBox(params);
  if (!box) return [];
  if (!Array.isArray(params.rows) || params.rows.length === 0) return [];

  const rows: string[][] = [];
  let cols = 0;
  for (const row of params.rows) {
    if (!Array.isArray(row)) return [];
    const cells = row.map((cell) => String(cell ?? ''));
    cols = Math.max(cols, cells.length);
    rows.push(cells);
  }
  if (cols === 0) return [];
  for (const row of rows) while (row.length < cols) row.push('');

  const cellWidth = box.width / cols;
  const cellHeight = box.height / rows.length;

  // One font size for the whole grid: shrink until the widest cell fits.
  let fontSize = Math.min(16, cellHeight * 0.45);
  for (const row of rows) {
    for (const cell of row) {
      if (cell.length === 0) continue;
      fontSize = Math.min(fontSize, (cellWidth - 8) / (0.6 * cell.length));
    }
  }
  fontSize = clamp(fontSize, 8, 16);

  const out: fabric.Object[] = [];
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const cellLeft = box.left + c * cellWidth;
      const cellTop = box.top + r * cellHeight;
      out.push(
        new fabric.Rect({
          left: cellLeft,
          top: cellTop,
          width: cellWidth,
          height: cellHeight,
          fill: 'transparent',
          stroke: STROKE_COLOR,
          strokeWidth: 1,
        })
      );
      if (cell.length > 0) {
        out.push(
          makeText(cell, cellLeft + cellWidth / 2, cellTop + cellHeight / 2, { fontSize })
        );
      }
    });
  });

  return out;
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

type PrimitiveRenderer = (params: Record<string, unknown>) => fabric.Object[];

const PRIMITIVES: Record<string, PrimitiveRenderer> = {
  axes: renderAxes,
  functionPlot: renderFunctionPlot,
  numberLine: renderNumberLine,
  fractionBar: renderFractionBar,
  triangleFigure: renderTriangleFigure,
  tableGrid: renderTableGrid,
};

export const PRIMITIVE_NAMES = Object.keys(PRIMITIVES);

// Render a primitive by name. NEVER throws: unknown names and invalid params
// produce an empty array (with a console.warn) so a bad AI command degrades to
// "nothing drawn" instead of breaking the whole step.
export function renderPrimitive(name: string, params: Record<string, unknown>): fabric.Object[] {
  try {
    const renderer = PRIMITIVES[name];
    if (!renderer) {
      console.warn(`[whiteboard] unknown primitive "${name}"`);
      return [];
    }
    if (!params || typeof params !== 'object') {
      console.warn(`[whiteboard] primitive "${name}" called without params`);
      return [];
    }
    const objects = renderer(params);
    if (objects.length === 0) {
      console.warn(`[whiteboard] primitive "${name}" produced nothing (invalid params?)`);
    }
    return objects;
  } catch (error) {
    console.warn(`[whiteboard] primitive "${name}" failed:`, error);
    return [];
  }
}

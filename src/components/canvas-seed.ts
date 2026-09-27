// The hardcoded content of /canvas: a rough map of the site's topics, spread out so that
// panning and zooming have something to show. The layout is a placeholder until the
// structure of the board is decided.
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';

const PINK = '#c8327f';
const GREEN = '#44cf7e';
const INK = '#1e1e1e';

type Rect = { x: number; y: number; w: number; h: number };
type Box = Rect & { id: string; text: string; color?: string; fill?: string; fontSize?: number };

// Every box is remembered so that arrows can be drawn from edge to edge.
const rects = new Map<string, Rect>();

const box = ({
	id,
	text,
	x,
	y,
	w,
	h,
	color = INK,
	fill = 'transparent',
	fontSize = 20,
}: Box): ExcalidrawElementSkeleton => {
	rects.set(id, { x, y, w, h });
	return {
		type: 'rectangle',
		id,
		x,
		y,
		width: w,
		height: h,
		strokeColor: color,
		backgroundColor: fill,
		fillStyle: 'solid',
		roundness: { type: 3 },
		label: { text, fontSize },
	};
};

// Where the line from a rectangle's center towards (tx, ty) leaves the rectangle, plus a small gap.
function edgePoint(r: Rect, tx: number, ty: number, gap: number): [number, number] {
	const cx = r.x + r.w / 2;
	const cy = r.y + r.h / 2;
	const dx = tx - cx;
	const dy = ty - cy;
	const scale = Math.min(r.w / 2 / Math.max(Math.abs(dx), 1e-9), r.h / 2 / Math.max(Math.abs(dy), 1e-9));
	const t = scale + gap / Math.hypot(dx, dy);
	return [cx + dx * t, cy + dy * t];
}

// A straight arrow between two boxes, bound to both.
const arrow = (from: string, to: string): ExcalidrawElementSkeleton => {
	const a = rects.get(from)!;
	const b = rects.get(to)!;
	const [sx, sy] = edgePoint(a, b.x + b.w / 2, b.y + b.h / 2, 8);
	const [ex, ey] = edgePoint(b, a.x + a.w / 2, a.y + a.h / 2, 8);
	return {
		type: 'arrow',
		x: sx,
		y: sy,
		width: Math.abs(ex - sx),
		height: Math.abs(ey - sy),
		points: [
			[0, 0],
			[ex - sx, ey - sy],
		],
		strokeColor: INK,
		start: { id: from },
		end: { id: to },
	};
};

const heading = (id: string, text: string, x: number, y: number, color: string): ExcalidrawElementSkeleton =>
	box({ id, text, x, y, w: 360, h: 90, color, fill: color === PINK ? '#fbeaf2' : '#e4f7ec', fontSize: 24 });

const note = (id: string, text: string, x: number, y: number): ExcalidrawElementSkeleton =>
	box({ id, text, x, y, w: 300, h: 70, fontSize: 18 });

export const seed: ExcalidrawElementSkeleton[] = [
	// Center.
	box({
		id: 'center',
		text: 'Formal methods\nin TypeScript',
		x: -220,
		y: -80,
		w: 440,
		h: 160,
		fill: '#fff9c4',
		fontSize: 28,
	}),
	{
		type: 'text',
		x: -220,
		y: 120,
		text: 'Scroll to pan.\nPinch or Ctrl+scroll to zoom.',
		fontSize: 16,
		strokeColor: '#5c5866',
	},

	// Concepts, to the left.
	heading('concepts', 'Concepts', -1500, -45, GREEN),
	note('c-sm', 'State machines', -1470, 140),
	note('c-pn', 'Petri nets', -1470, 260),
	note('c-spec', 'Formal specs', -1470, 380),
	arrow('center', 'concepts'),
	arrow('concepts', 'c-sm'),
	arrow('concepts', 'c-pn'),
	arrow('concepts', 'c-spec'),

	// TypeScript tools, to the right.
	heading('ts-tools', 'TypeScript tools', 1200, -45, GREEN),
	note('t-fc', 'fast-check', 1060, 140),
	note('t-xs', 'XState', 1400, 140),
	note('t-lp', 'libpetri', 1060, 260),
	note('t-em', 'effect-machine', 1400, 260),
	note('t-bo', 'Bombadil', 1060, 380),
	note('t-pg', 'Polygraph', 1400, 380),
	note('t-more', 'and more...', 1230, 500),
	arrow('center', 'ts-tools'),
	arrow('ts-tools', 't-fc'),
	arrow('ts-tools', 't-xs'),

	// Non-TypeScript tools, above.
	heading('non-ts', 'Non-TypeScript tools', -180, -900, PINK),
	note('n-tla', 'TLA+', -700, -1100),
	note('n-quint', 'Quint', -360, -1100),
	note('n-dafny', 'Dafny', -20, -1100),
	note('n-lean', 'Lean', 320, -1100),
	arrow('center', 'non-ts'),
	arrow('non-ts', 'n-tla'),
	arrow('non-ts', 'n-quint'),
	arrow('non-ts', 'n-dafny'),
	arrow('non-ts', 'n-lean'),

	// Use cases, below.
	heading('use-cases', 'Use cases', -180, 800, PINK),
	note('u-1', 'Connect on first use', -700, 1000),
	note('u-2', 'Webhook handled twice', -360, 1000),
	note('u-3', 'Stock reservation', -20, 1000),
	note('u-4', 'Checkout with Back', 320, 1000),
	arrow('center', 'use-cases'),
	arrow('use-cases', 'u-1'),
	arrow('use-cases', 'u-2'),
	arrow('use-cases', 'u-3'),
	arrow('use-cases', 'u-4'),

	// A far corner, so there is a reason to zoom out.
	heading('adoption', 'Adoption', 2000, 1300, GREEN),
	note('a-jobs', 'Job market', 1900, 1480),
	note('a-tools', 'Tools', 2240, 1480),
	arrow('use-cases', 'adoption'),
];

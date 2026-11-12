export type Point = [number, number];
export type Direction = "up" | "right" | "down" | "left";
export type Arrow = { id: number; points: Point[]; color: number };
export type Puzzle = {
  id: number;
  size: number;
  arrows: Arrow[];
  solution: number[];
};
export const DIRECTIONS: Record<Direction, Point> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
};
export function direction(a: Arrow): Direction {
  const h = a.points.at(-1)!,
    p = a.points.at(-2)!;
  return h[0] > p[0]
    ? "right"
    : h[0] < p[0]
      ? "left"
      : h[1] > p[1]
        ? "down"
        : "up";
}
export function ray(a: Arrow, size: number): Point[] {
  const [dx, dy] = DIRECTIONS[direction(a)],
    h = a.points.at(-1)!;
  const out: Point[] = [];
  for (
    let x = h[0] + dx, y = h[1] + dy;
    x >= 0 && y >= 0 && x < size && y < size;
    x += dx, y += dy
  )
    out.push([x, y]);
  return out;
}
export const key = ([x, y]: Point) => `${x},${y}`;
export function blockers(
  puzzle: Puzzle,
  remaining: number[],
  id: number,
): number[] {
  const arrow = puzzle.arrows.find((a) => a.id === id);
  if (!arrow || !remaining.includes(id)) return [];
  const ahead = new Set(ray(arrow, puzzle.size).map(key));
  return puzzle.arrows
    .filter(
      (a) =>
        a.id !== id &&
        remaining.includes(a.id) &&
        a.points.some((p) => ahead.has(key(p))),
    )
    .map((a) => a.id);
}
export function removable(puzzle: Puzzle, remaining: number[]): number[] {
  return remaining.filter((id) => blockers(puzzle, remaining, id).length === 0);
}
export function solve(
  puzzle: Puzzle,
  remaining = puzzle.arrows.map((a) => a.id),
): number[] | null {
  const left = [...remaining],
    order: number[] = [];
  while (left.length) {
    const next = removable(puzzle, left)[0];
    if (next === undefined) return null;
    order.push(next);
    left.splice(left.indexOf(next), 1);
  }
  return order;
}
export function validatePuzzle(p: Puzzle): boolean {
  const occupied = new Set<string>(),
    ids = new Set<number>();
  if (
    !Number.isInteger(p.size) ||
    p.size < 4 ||
    p.size > 16 ||
    !p.arrows.length
  )
    return false;
  for (const a of p.arrows) {
    if (
      ids.has(a.id) ||
      !Number.isInteger(a.id) ||
      a.id < 0 ||
      a.points.length < 2 ||
      !Number.isInteger(a.color) ||
      a.color < 0 ||
      a.color > 3
    )
      return false;
    ids.add(a.id);
    for (let i = 0; i < a.points.length; i++) {
      const cell = a.points[i];
      if (
        !cell.every(Number.isInteger) ||
        cell.some((v) => v < 0 || v >= p.size) ||
        occupied.has(key(cell))
      )
        return false;
      if (
        i &&
        Math.abs(cell[0] - a.points[i - 1][0]) +
          Math.abs(cell[1] - a.points[i - 1][1]) !==
          1
      )
        return false;
      occupied.add(key(cell));
    }
    const own = new Set(a.points.map(key));
    if (ray(a, p.size).some((c) => own.has(key(c)))) return false;
  }
  return solve(p) !== null;
}
export function generator(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export const tutorial: Puzzle = {
  id: 1,
  size: 8,
  arrows: [
    {
      id: 0,
      points: [
        [1, 1],
        [2, 1],
        [3, 1],
      ],
      color: 0,
    },
    {
      id: 1,
      points: [
        [5, 4],
        [5, 3],
        [5, 2],
        [5, 1],
      ],
      color: 1,
    },
    {
      id: 2,
      points: [
        [1, 5],
        [2, 5],
        [3, 5],
        [3, 4],
      ],
      color: 2,
    },
    {
      id: 3,
      points: [
        [5, 6],
        [6, 6],
        [6, 5],
      ],
      color: 0,
    },
    {
      id: 4,
      points: [
        [1, 7],
        [1, 6],
        [2, 6],
      ],
      color: 3,
    },
  ],
  solution: [1, 0, 2, 3, 4],
};
export function generatePuzzle(
  id: number,
  seed = 91273 + id * 7919,
  size = id < 8 ? 8 : id < 25 ? 10 : 12,
  target = Math.min(29, 8 + Math.floor(id / 2)),
): Puzzle {
  const random = generator(seed);
  let best: Arrow[] = [];
  for (let attempt = 0; attempt < 18; attempt++) {
    const arrows: Arrow[] = [],
      occupied = new Set<string>();
    for (let trial = 0; trial < 1800 && arrows.length < target; trial++) {
      const head: Point = [
        Math.floor(random() * size),
        Math.floor(random() * size),
      ];
      if (occupied.has(key(head))) continue;
      const dir = Object.values(DIRECTIONS)[Math.floor(random() * 4)];
      const ahead = new Set<string>();
      for (
        let x = head[0] + dir[0], y = head[1] + dir[1];
        x >= 0 && y >= 0 && x < size && y < size;
        x += dir[0], y += dir[1]
      )
        ahead.add(`${x},${y}`);
      if ([...ahead].some((k) => occupied.has(k))) continue;
      const behind: Point = [head[0] - dir[0], head[1] - dir[1]];
      if (behind.some((v) => v < 0 || v >= size) || occupied.has(key(behind)))
        continue;
      const backwards: Point[] = [head, behind],
        own = new Set(backwards.map(key));
      const length = 3 + Math.floor(random() * 5);
      while (backwards.length < length) {
        const tail = backwards.at(-1)!;
        const choices = Object.values(DIRECTIONS)
          .map(([dx, dy]) => [tail[0] + dx, tail[1] + dy] as Point)
          .filter(
            (p) =>
              p.every((v) => v >= 0 && v < size) &&
              !occupied.has(key(p)) &&
              !own.has(key(p)) &&
              !ahead.has(key(p)),
          );
        if (!choices.length) break;
        const p = choices[Math.floor(random() * choices.length)];
        backwards.push(p);
        own.add(key(p));
      }
      const points = backwards.reverse();
      points.forEach((p) => occupied.add(key(p)));
      arrows.push({
        id: arrows.length,
        points,
        color: Math.floor(random() * 4),
      });
    }
    if (arrows.length > best.length) best = arrows;
    if (arrows.length === target) break;
  }
  if (best.length < Math.min(6, target))
    throw Error("Puzzle generation failed");
  const result: Puzzle = {
    id,
    size,
    arrows: best,
    solution: best.map((a) => a.id).reverse(),
  };
  if (!validatePuzzle(result)) throw Error("Invalid generated puzzle");
  return result;
}
export function daySeed(day: string) {
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
// Clip a moving window along the arrow's route. The tail follows the bends;
// translating an entire bent arrow would visually pass through its neighbours.
export function escapePoints(
  arrow: Arrow,
  travel: number,
  extension: number,
): Point[] {
  const original = arrow.points.length - 1,
    head = arrow.points.at(-1)!,
    [dx, dy] = DIRECTIONS[direction(arrow)];
  const points: Point[] = [
    ...arrow.points,
    [head[0] + dx * extension, head[1] + dy * extension],
  ];
  const start = Math.max(0, travel),
    end = start + original,
    out: Point[] = [];
  let at = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      length = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    const lo = Math.max(start, at),
      hi = Math.min(end, at + length);
    if (hi > lo) {
      const point = (d: number): Point => [
        a[0] + ((b[0] - a[0]) * (d - at)) / length,
        a[1] + ((b[1] - a[1]) * (d - at)) / length,
      ];
      if (!out.length) out.push(point(lo));
      out.push(point(hi));
    }
    at += length;
  }
  return out;
}

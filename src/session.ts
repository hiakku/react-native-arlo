import levels from "./levels.json";
import { daySeed, generatePuzzle, type Puzzle } from "./engine";
export { levels };
export type Session = {
  mode: "journey" | "daily";
  level: number;
  day: string;
  remaining: number[];
  hearts: number;
  hints: number;
  revived: boolean;
  completed: Record<string, number>;
  dailyBest: Record<string, number>;
  motion: boolean;
  labels: boolean;
};
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function puzzleFor(g: Pick<Session, "mode" | "level" | "day">): Puzzle {
  return g.mode === "daily"
    ? generatePuzzle(1000, daySeed(g.day), 10, 19)
    : (levels[g.level] as Puzzle);
}
export function fresh(
  mode: "journey" | "daily" = "journey",
  level = 0,
  previous?: Session,
  day = today(),
): Session {
  const base = { mode, level, day };
  const p = puzzleFor(base);
  return {
    ...base,
    remaining: p.arrows.map((a) => a.id),
    hearts: 3,
    hints: previous?.hints ?? 3,
    revived: false,
    completed: previous?.completed ?? {},
    dailyBest: previous?.dailyBest ?? {},
    motion: previous?.motion ?? true,
    labels: previous?.labels ?? false,
  };
}
export function parseSession(raw: string): Session {
  const data = JSON.parse(raw),
    g = data?.game;
  if (
    data?.version !== 1 ||
    !g ||
    !["journey", "daily"].includes(g.mode) ||
    !Number.isInteger(g.level) ||
    g.level < 0 ||
    g.level >= levels.length ||
    !/^\d{4}-\d{2}-\d{2}$/.test(g.day)
  )
    throw Error("Unsupported progress");
  const p = puzzleFor(g),
    ids = new Set(p.arrows.map((a) => a.id));
  if (
    !Array.isArray(g.remaining) ||
    new Set(g.remaining).size !== g.remaining.length ||
    !g.remaining.every((id: unknown) => ids.has(id as number)) ||
    !Number.isInteger(g.hearts) ||
    g.hearts < 0 ||
    g.hearts > 3 ||
    !Number.isInteger(g.hints) ||
    g.hints < 0 ||
    g.hints > 10000 ||
    typeof g.motion !== "boolean" ||
    typeof g.labels !== "boolean" ||
    typeof g.revived !== "boolean"
  )
    throw Error("Invalid progress");
  for (const field of ["completed", "dailyBest"]) {
    const scores = g[field];
    if (!scores || typeof scores !== "object" || Array.isArray(scores))
      throw Error("Invalid scores");
    for (const [k, v] of Object.entries(scores))
      if (
        !Number.isInteger(v) ||
        Number(v) < 1 ||
        Number(v) > 3 ||
        (field === "completed"
          ? !/^\d+$/.test(k) || Number(k) >= levels.length
          : !/^\d{4}-\d{2}-\d{2}$/.test(k))
      )
        throw Error("Invalid score");
  }
  return g;
}

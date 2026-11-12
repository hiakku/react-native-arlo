import test from "node:test";
import assert from "node:assert/strict";
import { fresh, parseSession, puzzleFor } from "../src/session.ts";
const pack = (game) => JSON.stringify({ version: 1, game });
test("campaign progress round-trips and restarting preserves credits and completed stars", () => {
  const g = {
    ...fresh(),
    remaining: [0, 2, 3, 4],
    hearts: 2,
    hints: 1,
    completed: { 0: 2 },
  };
  const saved = parseSession(pack(g));
  assert.deepEqual(saved, g);
  const next = fresh("journey", 1, saved);
  assert.equal(next.hints, 1);
  assert.deepEqual(next.completed, { 0: 2 });
  assert.equal(next.hearts, 3);
});
test("daily progress preserves the original date when resumed on a later date", () => {
  const g = fresh("daily", 0, undefined, "2026-11-11");
  g.remaining.pop();
  const restored = parseSession(pack(g));
  assert.equal(restored.day, "2026-11-11");
  assert.deepEqual(puzzleFor(g), puzzleFor(restored));
  assert.notDeepEqual(
    puzzleFor(g),
    puzzleFor(fresh("daily", 0, g, "2026-11-12")),
  );
});
test("malformed saves cannot add arrows or impossible balances", () => {
  const g = fresh();
  for (const update of [
    { remaining: [999] },
    { remaining: [0, 0] },
    { hearts: -1 },
    { hearts: 4 },
    { hints: -1 },
    { completed: { 0: 4 } },
    { level: 60 },
    { day: "bad" },
  ])
    assert.throws(() => parseSession(pack({ ...g, ...update })));
});

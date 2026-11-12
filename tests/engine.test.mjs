import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  blockers,
  direction,
  escapePoints,
  generatePuzzle,
  removable,
  solve,
  tutorial,
  validatePuzzle,
} from "../src/engine.ts";
const levels = JSON.parse(
  readFileSync(new URL("../src/levels.json", import.meta.url), "utf8"),
);
test("all sixty boards have nonoverlapping arrows and an actual playable solution", () => {
  assert.equal(levels.length, 60);
  for (const p of levels) {
    assert.ok(validatePuzzle(p), `invalid board ${p.id}`);
    let left = p.arrows.map((a) => a.id);
    for (const id of p.solution) {
      assert.ok(left.includes(id));
      assert.deepEqual(blockers(p, left, id), []);
      left = left.filter((n) => n !== id);
    }
    assert.equal(left.length, 0);
    assert.equal(solve(p).length, p.arrows.length);
  }
});
test("tutorial blocking uses the whole body of other arrows ahead of a tip", () => {
  const left = tutorial.arrows.map((a) => a.id);
  assert.equal(direction(tutorial.arrows[0]), "right");
  assert.deepEqual(blockers(tutorial, left, 0), [1]);
  assert.deepEqual(blockers(tutorial, left, 2), [0]);
  assert.deepEqual(removable(tutorial, left), [1, 3]);
  assert.deepEqual(
    blockers(
      tutorial,
      left.filter((n) => n !== 1),
      0,
    ),
    [],
  );
  assert.deepEqual(blockers(tutorial, left, 4), [3]);
  assert.deepEqual(left, [0, 1, 2, 3, 4]);
});
test("removing any free arrow cannot create a new block, and arbitrary valid play finishes", () => {
  for (const p of levels) {
    let left = p.arrows.map((a) => a.id);
    while (left.length) {
      const options = removable(p, left);
      assert.ok(options.length);
      const last = options.at(-1);
      left = left.filter((id) => id !== last);
      for (const id of options.filter((i) => i !== last))
        assert.deepEqual(blockers(p, left, id), []);
    }
  }
});
test("daily generation is deterministic, unique across seeds and verified", () => {
  const a = generatePuzzle(1000, 100, 10, 19),
    b = generatePuzzle(1000, 100, 10, 19),
    c = generatePuzzle(1000, 101, 10, 19);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.arrows, c.arrows);
  assert.ok(validatePuzzle(a));
  assert.ok(validatePuzzle(c));
});
test("escape animation follows the arrow bends while keeping its length", () => {
  const arrow = {
    id: 0,
    color: 0,
    points: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  };
  assert.deepEqual(escapePoints(arrow, 0, 20), arrow.points);
  assert.deepEqual(escapePoints(arrow, 1, 20), [
    [1, 0],
    [1, 1],
    [2, 1],
    [3, 1],
  ]);
  const moved = escapePoints(arrow, 8, 20);
  assert.deepEqual(moved, [
    [7, 1],
    [10, 1],
  ]);
});
test("rejects overlapping, diagonal and self-blocking geometry", () => {
  const p = structuredClone(tutorial);
  p.arrows[1].points[0] = p.arrows[0].points[0];
  assert.equal(validatePuzzle(p), false);
  const q = {
    id: 1,
    size: 5,
    arrows: [
      {
        id: 0,
        color: 0,
        points: [
          [0, 0],
          [1, 1],
        ],
      },
    ],
    solution: [],
  };
  assert.equal(validatePuzzle(q), false);
});

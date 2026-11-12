import { writeFileSync } from "node:fs";
import {
  generatePuzzle,
  tutorial,
  validatePuzzle,
  solve,
} from "../src/engine.ts";
const levels = Array.from({ length: 60 }, (_, i) =>
  i === 0 ? tutorial : generatePuzzle(i + 1),
);
for (const level of levels) {
  if (!validatePuzzle(level) || !solve(level))
    throw Error(`Invalid puzzle ${level.id}`);
}
writeFileSync("src/levels.json", JSON.stringify(levels, null, 2) + "\n");
console.log(
  `Generated ${levels.length} verified puzzles; ${levels.at(-1).arrows.length} arrows in the last board.`,
);

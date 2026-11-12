import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
const mark = (size, padded = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="${padded ? 0 : 220}" fill="#315C46"/><circle cx="860" cy="120" r="320" fill="#477455" opacity=".55"/><path d="M300 750V420Q300 300 420 300H710M580 170L710 300L580 430" stroke="#F3F5E8" stroke-width="${padded ? 60 : 72}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="300" cy="760" r="34" fill="#D9E9AB"/></svg>`;
for (const [file, size, pad] of [
  ["icon.png", 1024, false],
  ["adaptive-icon.png", 1024, true],
  ["favicon.png", 64, false],
])
  writeFileSync(`assets/${file}`, new Resvg(mark(size, pad)).render().asPng());
writeFileSync("assets/icon.svg", mark(1024));
console.log("Rendered original SVG arrow app icons.");

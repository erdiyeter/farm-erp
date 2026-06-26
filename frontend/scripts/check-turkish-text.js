/* global process */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nDir = path.resolve(__dirname, "../src/i18n");

const forbiddenWords = [
  "Sec",
  "Sagim",
  "Asi",
  "Cikis",
  "Ilac",
  "Arinma",
  "Suresi",
  "Oncelik",
  "Goruntule",
  "Guncelle",
  "Basarili",
  "olustu",
];

const targetExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".json"]);

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(entryPath);
    }

    return targetExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

const matches = [];

for (const filePath of listFiles(i18nDir)) {
  const content = fs.readFileSync(filePath, "utf8");

  for (const word of forbiddenWords) {
    if (content.includes(word)) {
      matches.push(`${path.relative(process.cwd(), filePath)}: ${word}`);
    }
  }
}

if (matches.length > 0) {
  console.error("Broken ASCII-only Turkish text found:");
  for (const match of matches) {
    console.error(`- ${match}`);
  }
  process.exit(1);
}

console.log("Turkish i18n text check passed.");

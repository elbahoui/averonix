import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "dist");

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relative(filePath) {
  return toPosix(path.relative(root, filePath));
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) out.push(...walk(full));
    else if (stats.isFile()) out.push(full);
  }
  return out;
}

function isGeneratedSecretArtifact(filePath) {
  const rel = relative(filePath);
  const base = path.posix.basename(rel);
  return (
    rel === "dist/server/.dev.vars" ||
    rel === "dist/.env" ||
    rel === "dist/.env.local" ||
    base === ".dev.vars" ||
    base.endsWith(".dev.vars") ||
    base === ".env" ||
    base.startsWith(".env.") ||
    base.endsWith(".env")
  );
}

const removed = [];

for (const file of walk(distRoot)) {
  if (!isGeneratedSecretArtifact(file)) continue;
  rmSync(file, { force: true });
  removed.push(relative(file));
}

if (removed.length) {
  console.log("Removed generated secret artifacts:");
  for (const file of removed) console.log(`- ${file}`);
} else {
  console.log("No generated secret artifacts to remove.");
}

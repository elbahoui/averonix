import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
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

function isForbiddenDistArtifact(filePath) {
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

function runGit(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function isGitRepo() {
  try {
    return runGit(["rev-parse", "--is-inside-work-tree"]).trim() === "true";
  } catch {
    return false;
  }
}

function splitNullList(value) {
  return value.split("\0").filter(Boolean);
}

function isForbiddenRepoSecret(rel) {
  const normalized = toPosix(rel);
  if (normalized === ".env.example" || normalized === "backend/.env.example") return false;
  return (
    normalized === ".env" ||
    normalized.startsWith(".env.") ||
    normalized === "backend/.env" ||
    normalized.startsWith("backend/.env.") ||
    normalized === ".dev.vars" ||
    normalized === "dist/server/.dev.vars"
  );
}

const findings = [];

for (const file of walk(distRoot)) {
  if (isForbiddenDistArtifact(file)) findings.push(relative(file));
}

if (isGitRepo()) {
  const tracked = splitNullList(runGit(["ls-files", "-z"]));
  const staged = splitNullList(runGit(["diff", "--cached", "--name-only", "-z"]));
  for (const file of tracked) {
    if (isForbiddenRepoSecret(file)) findings.push(`${file} (tracked)`);
  }
  for (const file of staged) {
    if (isForbiddenRepoSecret(file)) findings.push(`${file} (staged)`);
  }
} else {
  console.warn("check:secrets: git metadata not found; skipping tracked/staged checks.");
}

if (findings.length) {
  console.error("Forbidden secret artifacts found:");
  for (const finding of [...new Set(findings)]) console.error(`- ${finding}`);
  console.error("Run npm run clean:secret-artifacts for generated dist artifacts.");
  process.exit(1);
}

console.log("No forbidden secret artifacts found.");

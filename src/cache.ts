import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

// ─── File-based commentary cache ─────────────────────────────────────────────

const CACHE_ENABLED = process.env.BIBLICAL_RESEARCH_CACHE !== "false";
// TTL in milliseconds — default 7 days (commentary doesn't change)
const CACHE_TTL_MS =
  parseInt(process.env.BIBLICAL_RESEARCH_CACHE_TTL_HOURS ?? "168", 10) *
  60 *
  60 *
  1000;

// Resolve cache dir relative to this file's location (works from dist/ too)
const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CACHE_DIR = join(PROJECT_ROOT, ".cache");

interface CacheEntry {
  createdAt: number;
  value: string;
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheKey(systemPrompt: string, userQuery: string): string {
  return createHash("sha256")
    .update(systemPrompt + "\x00" + userQuery)
    .digest("hex");
}

function cachePath(key: string): string {
  return join(CACHE_DIR, `${key}.json`);
}

export function getCached(
  systemPrompt: string,
  userQuery: string
): string | null {
  if (!CACHE_ENABLED) return null;

  try {
    const key = cacheKey(systemPrompt, userQuery);
    const path = cachePath(key);
    if (!existsSync(path)) return null;

    const entry: CacheEntry = JSON.parse(readFileSync(path, "utf8"));
    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
      return null; // Expired
    }
    return entry.value;
  } catch {
    return null; // Corrupt or missing — treat as cache miss
  }
}

export function setCached(
  systemPrompt: string,
  userQuery: string,
  value: string
): void {
  if (!CACHE_ENABLED) return;

  try {
    ensureCacheDir();
    const key = cacheKey(systemPrompt, userQuery);
    const entry: CacheEntry = { createdAt: Date.now(), value };
    writeFileSync(cachePath(key), JSON.stringify(entry), "utf8");
  } catch {
    // Cache write failure is non-fatal — just proceed without caching
  }
}

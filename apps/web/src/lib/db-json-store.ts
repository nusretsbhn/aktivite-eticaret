import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL?.trim();

let pool: Pool | null = null;
let schemaReady = false;

function getPool(): Pool | null {
  if (!DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const p = getPool();
  if (!p) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS app_json_store (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  schemaReady = true;
}

async function readLegacyJson<T>(legacyPath: string | undefined, fallback: () => T): Promise<T> {
  if (!legacyPath) return fallback();
  try {
    const raw = await readFile(legacyPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

async function writeLegacyJson(legacyPath: string | undefined, value: unknown): Promise<void> {
  if (!legacyPath) return;
  await mkdir(dirname(legacyPath), { recursive: true });
  await writeFile(legacyPath, JSON.stringify(value, null, 2), 'utf8');
}

export async function readJsonStore<T>(key: string, fallback: () => T, legacyPath?: string): Promise<T> {
  const p = getPool();
  if (!p) return readLegacyJson<T>(legacyPath, fallback);
  await ensureSchema();
  const result = await p.query<{ value: T }>('SELECT value FROM app_json_store WHERE key = $1 LIMIT 1', [key]);
  if (result.rowCount && result.rows[0]) {
    return result.rows[0].value;
  }
  const initial = await readLegacyJson<T>(legacyPath, fallback);
  await writeJsonStore(key, initial, legacyPath);
  return initial;
}

export async function writeJsonStore(key: string, value: unknown, legacyPath?: string): Promise<void> {
  const p = getPool();
  if (!p) {
    await writeLegacyJson(legacyPath, value);
    return;
  }
  await ensureSchema();
  await p.query(
    `
      INSERT INTO app_json_store (key, value, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `,
    [key, JSON.stringify(value)],
  );
}

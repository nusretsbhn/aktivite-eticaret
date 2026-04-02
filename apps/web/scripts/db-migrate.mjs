import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

import pg from 'pg';

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error('DATABASE_URL is required for migrations.');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
});

const migrationsDir = join(process.cwd(), 'migrations');

async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const exists = await client.query('SELECT id FROM app_migrations WHERE id = $1 LIMIT 1', [file]);
    if (exists.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO app_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}

run()
  .then(async () => {
    await client.end();
  })
  .catch(async (error) => {
    console.error(error);
    await client.end();
    process.exit(1);
  });

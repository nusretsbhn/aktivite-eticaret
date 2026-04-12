import { existsSync } from 'node:fs';
import { join } from 'node:path';

function hasNextConfig(dir: string): boolean {
  return (
    existsSync(join(dir, 'next.config.ts')) ||
    existsSync(join(dir, 'next.config.mjs')) ||
    existsSync(join(dir, 'next.config.js'))
  );
}

function detectNextAppRootFromCwd(): string {
  const cwd = process.cwd();
  if (hasNextConfig(cwd)) return cwd;
  const appsWeb = join(cwd, 'apps', 'web');
  if (hasNextConfig(appsWeb)) return appsWeb;
  const nested = join(cwd, 'bodrum-aktivite', 'apps', 'web');
  if (hasNextConfig(nested)) return nested;
  return cwd;
}

/**
 * `apps/web` kökü (package.json / next.config bulunduğu dizin).
 * EasyPanel vb. ortamlarda `process.cwd()` repo kökü kalabildiği için açıkça çözülür.
 * İsterseniz: `NEXT_APP_ROOT=/path/to/apps/web`
 */
export function getNextAppRoot(): string {
  const root = process.env.NEXT_APP_ROOT?.trim();
  if (root) return root;
  const pub = process.env.NEXT_APP_PUBLIC_DIR?.trim();
  if (pub) return join(pub, '..');
  return detectNextAppRootFromCwd();
}

/**
 * Next.js `public/` klasörünün mutlak yolu.
 * İsterseniz: `NEXT_APP_PUBLIC_DIR=/path/to/apps/web/public`
 */
export function getNextPublicDir(): string {
  const env = process.env.NEXT_APP_PUBLIC_DIR?.trim();
  if (env) return env;
  return join(getNextAppRoot(), 'public');
}

/** Kalıcı medya dosyaları (admin upload). `UPLOADS_DIR` yoksa `data/uploads`. */
export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR?.trim() || join(getNextAppRoot(), 'data', 'uploads');
}

/**
 * `/api/uploads/...` ile sunulan dosyaların aranacağı kök dizinler.
 * Yazma `getUploadsDir()` altına yapıldığı için okuma da bu dizini kapsamalıdır (aksi halde 404 / kırık resim).
 */
export function getPublicSearchDirs(): string[] {
  const uploadsDir = process.env.UPLOADS_DIR?.trim();
  const dirs = [
    ...(uploadsDir ? [uploadsDir] : []),
    getUploadsDir(),
    getNextPublicDir(),
    join(process.cwd(), 'public'),
    join(process.cwd(), 'apps', 'web', 'public'),
    join(process.cwd(), 'bodrum-aktivite', 'apps', 'web', 'public'),
  ];
  const uniq: string[] = [];
  for (const d of dirs) {
    if (d && !uniq.includes(d)) uniq.push(d);
  }
  return uniq;
}

/** JSON fallback ve geçici dosyalar için `data/` alt yolu. */
export function appDataFile(filename: string): string {
  return join(getNextAppRoot(), 'data', filename);
}

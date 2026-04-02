import 'dotenv/config';

import { DataSource } from 'typeorm';
import path from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL missing');
}

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  // Entity’ler eklendikçe buradaki glob çalışır (şimdilik boş kalabilir).
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations', '*{.js,.ts}')],
});

export default AppDataSource;


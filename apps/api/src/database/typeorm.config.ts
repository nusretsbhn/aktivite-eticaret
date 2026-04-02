import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = config.get<string>('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL missing');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    // Entity’leri bu app'in src klasörüyle sınırlı yükle.
    entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    synchronize: false,

    // Migration’lar derlenmiş çıktıda (dist) bulunacak şekilde ayarlanır.
    migrations: [path.join(__dirname, 'migrations', '*{.js,.ts}')],
  };
};


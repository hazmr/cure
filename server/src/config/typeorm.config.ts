import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { entities } from '../database/entities';

export const typeOrmConfig = registerAs(
  'typeorm',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'cure',
    password: process.env.DATABASE_PASSWORD ?? 'cure',
    database: process.env.DATABASE_NAME ?? 'cure',
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : false,
    entities,
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    logging: process.env.TYPEORM_LOGGING === 'true',
  }),
);


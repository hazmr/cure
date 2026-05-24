import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { entities } from '../database/entities';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'cure',
  password: process.env.DATABASE_PASSWORD ?? 'cure',
  database: process.env.DATABASE_NAME ?? 'cure',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities,
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
});


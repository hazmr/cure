export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? '',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  },
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER ?? 'cure',
    password: process.env.DATABASE_PASSWORD ?? 'cure',
    name: process.env.DATABASE_NAME ?? 'cure',
    ssl: process.env.DATABASE_SSL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret-at-least-32-chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret-at-least-32-chars',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@cure.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
    adminFirstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'CURE',
    adminLastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Admin',
  },
});


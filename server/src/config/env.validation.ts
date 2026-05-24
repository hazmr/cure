import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().allow('').default(''),
  CORS_ORIGIN: Joi.string().default('*'),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().allow('').required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_MIGRATIONS_RUN: Joi.boolean().truthy('true').falsy('false').default(false),
  TYPEORM_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  THROTTLE_TTL: Joi.number().integer().positive().default(60),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(120),

  SEED_ADMIN_EMAIL: Joi.string().email({ tlds: { allow: false } }).default('admin@cure.local'),
  SEED_ADMIN_PASSWORD: Joi.string().min(10).default('ChangeMe123!'),
  SEED_ADMIN_FIRST_NAME: Joi.string().default('CURE'),
  SEED_ADMIN_LAST_NAME: Joi.string().default('Admin'),
});

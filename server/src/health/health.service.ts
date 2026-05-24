import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../redis/redis.constants';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  services: {
    app: 'ok';
    postgres: 'ok' | 'error';
    redis: 'ok' | 'error';
  };
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const [postgres, redis] = await Promise.all([this.checkPostgres(), this.checkRedis()]);
    return {
      status: postgres === 'ok' && redis === 'ok' ? 'ok' : 'error',
      services: {
        app: 'ok',
        postgres,
        redis,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkPostgres(): Promise<'ok' | 'error'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<'ok' | 'error'> {
    try {
      if (this.redis.status === 'wait') {
        await this.redis.connect();
      }
      await this.redis.ping();
      return 'ok';
    } catch {
      return 'error';
    }
  }
}


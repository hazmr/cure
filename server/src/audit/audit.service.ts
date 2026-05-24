import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toPaginatedResult } from '../common/interfaces/paginated-result.interface';
import { AuditLog } from '../database/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
  ) {}

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog = this.auditLogsRepository.create({
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      oldValues: input.oldValues ?? null,
      newValues: input.newValues ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
    return this.auditLogsRepository.save(auditLog);
  }

  async list(query: AuditLogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.auditLogsRepository.createQueryBuilder('auditLog');

    if (query.userId) {
      qb.andWhere('auditLog.userId = :userId', { userId: query.userId });
    }
    if (query.action) {
      qb.andWhere('auditLog.action = :action', { action: query.action });
    }
    if (query.entity) {
      qb.andWhere('auditLog.entity = :entity', { entity: query.entity });
    }
    if (query.entityId) {
      qb.andWhere('auditLog.entityId = :entityId', { entityId: query.entityId });
    }
    if (query.from) {
      qb.andWhere('auditLog.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('auditLog.createdAt <= :to', { to: new Date(query.to) });
    }

    qb.orderBy('auditLog.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [logs, total] = await qb.getManyAndCount();
    return toPaginatedResult(logs, total, page, limit);
  }
}


import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, mergeMap } from 'rxjs';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { AuditService } from './audit.service';

type RequestWithUser = Request & {
  user?: RequestUser;
  params: Record<string, string | undefined>;
  body: Record<string, unknown>;
};

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const redactedKeys = new Set([
  'password',
  'passwordHash',
  'refreshToken',
  'refreshTokenHash',
  'accessToken',
]);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    return next.handle().pipe(
      mergeMap(async (result: unknown) => {
        if (this.shouldAudit(request)) {
          await this.audit(request, result);
        }

        return result;
      }),
    );
  }

  private shouldAudit(request: RequestWithUser): boolean {
    if (!mutationMethods.has(request.method)) {
      return false;
    }

    return !this.getEntity(request).startsWith('audit-logs');
  }

  private async audit(request: RequestWithUser, result: unknown): Promise<void> {
    try {
      await this.auditService.create({
        userId: request.user?.userId ?? null,
        action: this.getAction(request.method),
        entity: this.getEntity(request),
        entityId: request.params.id ?? this.extractResultId(result),
        oldValues: null,
        newValues: this.getNewValues(request, result),
        ip: request.ip,
        userAgent: request.get('user-agent') ?? null,
      });
    } catch {
      // Audit logging must not change API outcomes.
    }
  }

  private getAction(method: string): string {
    const actionByMethod: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return actionByMethod[method] ?? method.toLowerCase();
  }

  private getEntity(request: RequestWithUser): string {
    const url = request.route?.path ? request.baseUrl + request.route.path : request.path;
    return url.replace(/^\/+/, '').split('/')[0] || 'unknown';
  }

  private getNewValues(request: RequestWithUser, result: unknown): Record<string, unknown> | null {
    if (request.method === 'DELETE') {
      return null;
    }

    return this.redact({
      body: request.body ?? {},
      result,
    });
  }

  private extractResultId(result: unknown): string | null {
    if (result && typeof result === 'object' && 'id' in result) {
      const id = (result as { id?: unknown }).id;
      return typeof id === 'string' ? id : null;
    }
    return null;
  }

  private redact(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return this.redactObject(value as Record<string, unknown>);
  }

  private redactObject(value: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (redactedKeys.has(key)) {
          return [key, '[redacted]'];
        }
        if (Array.isArray(entry)) {
          return [key, entry.map((item) => (typeof item === 'object' && item !== null ? this.redactObject(item as Record<string, unknown>) : item))];
        }
        if (typeof entry === 'object' && entry !== null) {
          return [key, this.redactObject(entry as Record<string, unknown>)];
        }
        return [key, entry];
      }),
    );
  }
}


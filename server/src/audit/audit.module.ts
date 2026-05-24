import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../database/audit-log.entity';
import { AuditLogsController } from './audit-logs.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}


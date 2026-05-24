import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/enums';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-logs')
@Roles(UserRole.ADMIN)
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: AuditLogQueryDto) {
    return this.auditService.list(query);
  }
}


import { Controller, Get, Param } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system activities (Admin only)' })
  findAll() {
    return this.auditLogsService.findAll();
  }

  @Get('record/:id')
  @ApiOperation({ summary: 'Get history for a specific record ID' })
  findByRecord(@Param('id') id: string) {
    return this.auditLogsService.findByRecord(id);
  }
}

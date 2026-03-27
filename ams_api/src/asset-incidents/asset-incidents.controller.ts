import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetIncidentsService } from './asset-incidents.service';
import { ReportIncidentDto } from './dto/report-asset-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-asset-incident.dto';

@ApiTags('Asset Incidents & Investigations')
@Controller('asset-incidents')
export class AssetIncidentsController {
  constructor(private readonly assetIncidentsService: AssetIncidentsService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report a broken or missing asset' })
  reportIncident(@Body() dto: ReportIncidentDto) {
    return this.assetIncidentsService.reportIncident(dto);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve an investigation (Accept or Deny)' })
  resolveIncident(@Param('id') id: string, @Body() dto: ResolveIncidentDto) {
    return this.assetIncidentsService.resolveIncident(
      id,
      dto.resolution,
      dto.remarks,
    );
  }
}

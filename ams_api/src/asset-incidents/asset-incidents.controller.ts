import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetIncidentsService } from './asset-incidents.service';
import { ReportIncidentDto } from './dto/report-asset-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-asset-incident.dto';
import { ForwardIncidentDto } from './dto/forward-asset-incident.dto';

@ApiTags('Asset Incidents & Investigations')
@Controller('asset-incidents')
export class AssetIncidentsController {
  constructor(private readonly assetIncidentsService: AssetIncidentsService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report a broken or missing asset' })
  reportIncident(@Body() dto: ReportIncidentDto) {
    return this.assetIncidentsService.reportIncident(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all asset incidents' })
  findAll() {
    return this.assetIncidentsService.findAll();
  }

  @Patch(':id/forward')
  @ApiOperation({ summary: 'Forward investigation to CEO' })
  forwardToCEO(@Param('id') id: string, @Body() dto: ForwardIncidentDto) {
    return this.assetIncidentsService.forwardToCEO(id, dto.remarks);
  }

  @Patch(':id/start-repair')
  @ApiOperation({ summary: 'Mark an incident as currently in repair' })
  startRepair(@Param('id') id: string) {
    return this.assetIncidentsService.startRepair(id);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve an incident with a specific outcome' })
  resolveIncident(@Param('id') id: string, @Body() dto: ResolveIncidentDto) {
    return this.assetIncidentsService.resolveIncident(id, dto);
  }

  @Patch(':id/resolve-penalty')
  @ApiOperation({ summary: 'Mark a liability penalty as resolved' })
  resolvePenalty(@Param('id') id: string) {
    return this.assetIncidentsService.togglePenaltyResolution(id);
  }
}

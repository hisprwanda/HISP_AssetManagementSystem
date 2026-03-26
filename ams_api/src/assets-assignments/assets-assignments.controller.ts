import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AssetAssignmentsService } from "./assets-assignments.service";
import { CreateAssetAssignmentDto } from "./dto/create-assets-assignment.dto";
import { UpdateAssetAssignmentDto } from "./dto/update-assets-assignment.dto";

@ApiTags('Asset Assignments')
@Controller('asset-assignments')
export class AssetAssignmentsController {
  constructor(private readonly assetAssignmentsService: AssetAssignmentsService) { }

  @Post()
  @ApiOperation({ summary: 'Assign an asset to a user (Check-out)' })
  create(@Body() createAssetAssignmentDto: CreateAssetAssignmentDto) {
    return this.assetAssignmentsService.create(createAssetAssignmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get full history of all asset assignments' })
  findAll() {
    return this.assetAssignmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific assignment record' })
  findOne(@Param('id') id: string) {
    return this.assetAssignmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assignment details or record a Return (Check-in)' })
  update(
    @Param('id') id: string,
    @Body() updateAssetAssignmentDto: UpdateAssetAssignmentDto
  ) {
    return this.assetAssignmentsService.update(id, updateAssetAssignmentDto);
  }
}
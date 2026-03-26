import { Controller, Get, Post, Body, Patch, Param } from "@nestjs/common";
import { AssetRequestsService } from "./assets-requests.service";
import { CreateAssetRequestDto } from "./dto/create-assets-request.dto";
import { UpdateAssetRequestDto } from "./dto/update-assets-request.dto";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags('Asset Requests Workflow')
@Controller('asset-requests')
export class AssetRequestsController {
  constructor(private readonly assetRequestsService: AssetRequestsService) { }

  @Post()
  @ApiOperation({ summary: 'Submit a new equipment request' })
  create(@Body() createAssetRequestDto: CreateAssetRequestDto) {
    return this.assetRequestsService.create(createAssetRequestDto);
  }

  @Get()
  @ApiOperation({ summary: 'View all requests (for Admin/CEO dashboard)' })
  findAll() {
    return this.assetRequestsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'View a specific request' })
  findOne(@Param('id') id: string) {
    return this.assetRequestsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Advance the request workflow (Approve/Reject/Verify)' })
  update(@Param('id') id: string, @Body() updateAssetRequestDto: UpdateAssetRequestDto) {
    return this.assetRequestsService.update(id, updateAssetRequestDto);
  }
}


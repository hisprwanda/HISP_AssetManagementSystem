import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { DisposeAssetDto } from './dto/dispose-asset.dto';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('ping')
  ping() {
    return { status: 'ok', module: 'Assets' };
  }

  @Post('/batch-update')
  @ApiOperation({ summary: 'Bulk register assets' })
  bulkCreate(@Body() assets: Record<string, any>[]) {
    console.log(`[AssetsController] RECEIVING BATCH: ${assets?.length} items`);
    return this.assetsService.bulkCreate(assets);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new physical asset' })
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets with relations' })
  findAll() {
    return this.assetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific asset and its assignment history' })
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset details or assignment status' })
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }
  @Patch(':id/dispose')
  @ApiOperation({ summary: 'Officially retire/dispose of an asset' })
  dispose(@Param('id') id: string, @Body() disposeAssetDto: DisposeAssetDto) {
    return this.assetsService.dispose(id, disposeAssetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an asset from the system' })
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }

  @Post('recalculate')
  recalculateAll() {
    return this.assetsService.recalculateAll();
  }

  @Patch(':id/initiate-return')
  @ApiOperation({ summary: 'Initiate the return process for an asset' })
  initiateReturn(@Param('id') id: string, @Body('userId') userId: string) {
    return this.assetsService.initiateReturn(id, userId);
  }

  @Patch(':id/acknowledge-return')
  @ApiOperation({ summary: 'Admin acknowledges receipt of return request' })
  acknowledgeReturn(@Param('id') id: string) {
    return this.assetsService.acknowledgeReturn(id);
  }

  @Patch(':id/finalize-return')
  @ApiOperation({ summary: 'Admin finalizes the return after inspection' })
  finalizeReturn(
    @Param('id') id: string,
    @Body() params: { isDamaged: boolean; remarks?: string; location?: string },
  ) {
    return this.assetsService.finalizeReturn(id, params);
  }
}

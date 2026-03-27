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
}

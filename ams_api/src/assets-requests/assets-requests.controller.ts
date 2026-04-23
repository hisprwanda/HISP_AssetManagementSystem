import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { AssetRequestsService } from './assets-requests.service';
import { CreateAssetRequestDto } from './dto/create-assets-request.dto';
import { CreateBulkRequestDto } from './dto/create-bulk-request.dto';
import { ReviewBulkRequestDto } from './dto/review-bulk-request.dto';
import { FormalizeBulkRequestDto } from './dto/formalize-bulk-request.dto';
import { UpdateAssetRequestDto } from './dto/update-assets-request.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Asset Requests Workflow')
@Controller('assets-requests')
export class AssetRequestsController {
  constructor(private readonly assetRequestsService: AssetRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new equipment request' })
  create(@Body() createAssetRequestDto: CreateAssetRequestDto) {
    return this.assetRequestsService.create(createAssetRequestDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Submit multiple equipment requests as a batch' })
  createBulk(@Body() createBulkRequestDto: CreateBulkRequestDto) {
    return this.assetRequestsService.createBulkRequest(createBulkRequestDto);
  }

  @Patch('bulk/:batchNumber/hod-review')
  @ApiOperation({ summary: 'HOD review for a batch of requests' })
  hodReviewBulk(
    @Param('batchNumber') batchNumber: string,
    @Body() reviewDto: ReviewBulkRequestDto,
  ) {
    return this.assetRequestsService.reviewBulkByHOD(batchNumber, reviewDto);
  }

  @Patch('bulk/:batchNumber/formalize')
  @ApiOperation({ summary: 'Submit official requisition form for a batch' })
  formalizeBulk(
    @Param('batchNumber') batchNumber: string,
    @Body() formalizeDto: FormalizeBulkRequestDto,
  ) {
    return this.assetRequestsService.formalizeBulkRequest(
      batchNumber,
      formalizeDto,
    );
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
  @ApiOperation({
    summary: 'Advance the request workflow (Approve/Reject/Verify)',
  })
  update(
    @Param('id') id: string,
    @Body() updateAssetRequestDto: UpdateAssetRequestDto,
  ) {
    return this.assetRequestsService.update(id, updateAssetRequestDto);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AssetRequestsService } from './assets-requests.service';
import { CreateAssetRequestDto } from './dto/create-assets-request.dto';
import { CreateBulkRequestDto } from './dto/create-bulk-request.dto';
import { ReviewBulkRequestDto } from './dto/review-bulk-request.dto';
import { FormalizeBulkRequestDto } from './dto/formalize-bulk-request.dto';
import { UpdateAssetRequestDto } from './dto/update-assets-request.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface MulterFile {
  filename: string;
  mimetype: string;
}

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

  @Post(':id/upload-po-scanned')
  @ApiOperation({ summary: 'Upload a scanned PDF signed Purchase Order' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadPoScanned(
    @Param('id') id: string,
    @UploadedFile()
    file: MulterFile,
  ) {
    console.log(
      '[AssetsRequestsController] Received upload request for ID:',
      id,
    );
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Only PDF files are allowed.`,
      );
    }

    const fileUrl = `/uploads/${file.filename}`;
    return this.assetRequestsService.uploadPoScanned(id, fileUrl);
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

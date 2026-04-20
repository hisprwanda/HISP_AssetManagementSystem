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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetAssignmentsService } from './assets-assignments.service';
import { CreateAssetAssignmentDto } from './dto/create-assets-assignment.dto';
import { UpdateAssetAssignmentDto } from './dto/update-assets-assignment.dto';
import { PrepareAssignmentDto } from './dto/prepare-assignment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface MulterFile {
  filename: string;
  mimetype: string;
}

@ApiTags('Asset Assignments')
@Controller('asset-assignments')
export class AssetAssignmentsController {
  constructor(
    private readonly assetAssignmentsService: AssetAssignmentsService,
  ) {}

  @Post(':id/upload-scanned')
  @ApiOperation({ summary: 'Upload a scanned PDF paper form' })
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
  uploadScanned(
    @Param('id') id: string,
    @UploadedFile()
    file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Only PDF files are allowed.`,
      );
    }

    const fileUrl = `/uploads/${file.filename}`;
    return this.assetAssignmentsService.uploadScannedForm(id, fileUrl);
  }

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
  @ApiOperation({
    summary: 'Update assignment details or record a Return (Check-in)',
  })
  update(
    @Param('id') id: string,
    @Body() updateAssetAssignmentDto: UpdateAssetAssignmentDto,
  ) {
    return this.assetAssignmentsService.update(id, updateAssetAssignmentDto);
  }

  @Patch(':id/prepare-admin')
  @ApiOperation({ summary: 'Admin preparation of receipt form' })
  prepareByAdmin(
    @Param('id') id: string,
    @Body() prepareDto: PrepareAssignmentDto,
  ) {
    return this.assetAssignmentsService.prepareByAdmin(id, prepareDto);
  }

  @Patch(':id/sign-user')
  @ApiOperation({ summary: 'Record staff signature on receipt form' })
  signByUser(
    @Param('id') id: string,
    @Body('signatureName') signatureName: string,
  ) {
    return this.assetAssignmentsService.signByUser(id, signatureName);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Admin final approval/rejection of receipt form' })
  verifyByAdmin(
    @Param('id') id: string,
    @Body()
    body: { approve: boolean; remarks?: string; adminSignatureName?: string },
  ) {
    return this.assetAssignmentsService.verifyByAdmin(
      id,
      body.approve,
      body.remarks,
      body.adminSignatureName,
    );
  }
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class AssetUpdateDto {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  serial_number?: string;

  @IsString()
  @IsOptional()
  tag_id?: string;
}

export class UpdateBulkPrepareDto {
  @ApiPropertyOptional({ description: 'The form number to update' })
  @IsString()
  formNumber: string;

  @ApiPropertyOptional({ description: 'Condition of the assets at handover' })
  @IsString()
  @IsOptional()
  condition_on_assign?: string;

  @ApiPropertyOptional({
    description: 'Name of the person/entity handing over',
  })
  @IsString()
  @IsOptional()
  received_from_name?: string;

  @ApiPropertyOptional({ description: 'Corrected Phone Number if typo exists' })
  @IsString()
  @IsOptional()
  user_phone_number?: string;

  @ApiPropertyOptional({
    description: 'If true, transitions form to PENDING_USER_SIGNATURE',
  })
  @IsBoolean()
  @IsOptional()
  sendToUser?: boolean;

  @ApiPropertyOptional({
    description: 'Digital signature name of the user (for Finance Officers)',
  })
  @IsString()
  @IsOptional()
  userSignatureName?: string;

  @ApiPropertyOptional({ description: 'Specific asset updates (SN/Tag)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetUpdateDto)
  @IsOptional()
  assets?: AssetUpdateDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class NewAssetDetail {
  @IsString()
  category_id: string;

  @IsString()
  @IsOptional()
  serial_number?: string;

  @IsString()
  @IsOptional()
  tag_id?: string;

  @IsString()
  name: string;
}

export class DeployAssetRequestDto {
  @ApiProperty({ description: 'List of specific existing asset IDs to assign' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  asset_ids?: string[];

  @ApiProperty({ description: 'List of new assets to create and assign' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NewAssetDetail)
  new_assets?: NewAssetDetail[];

  @ApiProperty({ description: 'Optional condition notes for the handover' })
  @IsOptional()
  @IsString()
  condition_notes?: string;

  @IsOptional()
  @IsString()
  purchase_date?: string;

  @IsOptional()
  @IsString()
  warranty_expiry_date?: string;

  @ApiProperty({ description: 'Name of the admin performing the handover' })
  @IsString()
  @IsOptional()
  received_from_name?: string;
}

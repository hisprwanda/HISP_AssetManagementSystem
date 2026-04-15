import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PrepareAssignmentDto {
  @ApiPropertyOptional({ description: 'Condition of the asset at handover' })
  @IsString()
  @IsOptional()
  condition_on_assign?: string;

  @ApiPropertyOptional({
    description: 'Name of the person/entity handing over',
  })
  @IsString()
  @IsOptional()
  received_from_name?: string;

  @ApiPropertyOptional({
    description: 'Corrected Serial Number if typo exists',
  })
  @IsString()
  @IsOptional()
  asset_serial_number?: string;

  @ApiPropertyOptional({ description: 'Corrected Tag ID if typo exists' })
  @IsString()
  @IsOptional()
  asset_tag_id?: string;

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
}

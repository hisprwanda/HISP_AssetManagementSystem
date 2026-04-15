import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiPropertyOptional({
    description: 'System generated tag ID (e.g., HISP-RW-001)',
  })
  @IsOptional()
  @IsString()
  tag_id?: string;

  @ApiProperty({ example: 'PF329X4' })
  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @ApiProperty({ example: 'ThinkPad T14 Gen 3' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ['IN_STOCK', 'ASSIGNED', 'BROKEN', 'MISSING', 'DISPOSED'],
  })
  @IsString()
  @IsIn(['IN_STOCK', 'ASSIGNED', 'BROKEN', 'MISSING', 'DISPOSED'])
  status: string;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @ApiPropertyOptional({ example: 1250.0 })
  @IsOptional()
  @IsNumber()
  purchase_cost?: number;

  @ApiPropertyOptional({ example: 'Kigali HQ - IT Room' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @IsDateString()
  warranty_expiry?: string;

  @ApiProperty()
  @IsUUID()
  category_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({ description: 'UUID of the user it is assigned to' })
  @IsOptional()
  @IsUUID()
  assigned_to_user_id?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  is_shared?: boolean;
}

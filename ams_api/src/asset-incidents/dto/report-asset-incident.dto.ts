import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsIn,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportIncidentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  asset_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ enum: ['BROKEN', 'MISSING'] })
  @IsString()
  @IsIn(['BROKEN', 'MISSING'])
  type: string;

  @ApiProperty({ example: 'Fell out of a canoe during field visit' })
  @IsString()
  @IsNotEmpty()
  explanation: string;

  @ApiPropertyOptional({
    description: 'URL to uploaded photo or police report',
  })
  @IsOptional()
  @IsString()
  evidence_url?: string;
}

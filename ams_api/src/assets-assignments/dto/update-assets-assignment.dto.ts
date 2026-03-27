import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAssetAssignmentDto } from './create-assets-assignment.dto';

export class UpdateAssetAssignmentDto extends PartialType(
  CreateAssetAssignmentDto,
) {
  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  returned_at?: string;
}

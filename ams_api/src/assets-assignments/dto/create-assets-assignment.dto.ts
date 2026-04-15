import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateAssetAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  asset_id: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsOptional()
  condition_on_assign?: string;
  @IsDateString()
  @IsOptional()
  assigned_at?: string | Date;
}

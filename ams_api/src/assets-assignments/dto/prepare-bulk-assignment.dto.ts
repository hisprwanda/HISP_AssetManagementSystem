import {
  IsArray,
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class PrepareBulkAssignmentDto {
  @IsArray()
  @IsUUID(4, { each: true })
  asset_ids: string[];

  @IsUUID(4)
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  received_from_name: string;

  @IsString()
  @IsOptional()
  condition_notes?: string;
}

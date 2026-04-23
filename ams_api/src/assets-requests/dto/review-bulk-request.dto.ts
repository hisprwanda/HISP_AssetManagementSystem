import {
  IsArray,
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class ReviewBulkRequestDto {
  @IsBoolean()
  approve: boolean;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  rejected_item_ids?: string[];
}

import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class BulkItemUpdateDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;
}

export class FormalizeBulkRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkItemUpdateDto)
  items: BulkItemUpdateDto[];

  @IsNumber()
  @Min(0)
  transport_fees: number;

  @IsString()
  urgency: string;

  @IsString()
  @IsOptional()
  description?: string;
}

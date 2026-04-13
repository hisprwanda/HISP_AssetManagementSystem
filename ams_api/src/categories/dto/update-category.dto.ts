import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  depreciation_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  disposal_rate?: number;
}

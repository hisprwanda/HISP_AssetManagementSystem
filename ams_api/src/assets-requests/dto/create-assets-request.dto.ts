import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

class RequestItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;
}

class FinancialsDto {
  @IsEnum(['BUDGET', 'MARKET_RESEARCH', 'ESTIMATE'])
  cost_basis: string;

  @IsNumber()
  @Min(0)
  transport_fees: number;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  grand_total: number;

  @IsString()
  @IsOptional()
  budget_code_1?: string;

  @IsString()
  @IsOptional()
  budget_code_2?: string;
}

class LogisticsDto {
  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsString()
  @IsOptional()
  contact_email?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;
}

export class CreateAssetRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  requested_by_id: string;

  @IsUUID()
  @IsNotEmpty()
  department_id: string;

  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];

  @ValidateNested()
  @Type(() => FinancialsDto)
  financials: FinancialsDto;

  @ValidateNested()
  @Type(() => LogisticsDto)
  logistics: LogisticsDto;
}

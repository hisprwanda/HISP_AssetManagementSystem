import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAssetRequestDto {
    @ApiPropertyOptional({ enum: ['PENDING', 'HOD_INITIATED', 'FINANCE_VERIFIED', 'CEO_APPROVED', 'REJECTED'] })
    @IsOptional()
    @IsIn(['PENDING', 'HOD_INITIATED', 'FINANCE_VERIFIED', 'CEO_APPROVED', 'REJECTED'])
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    verified_by_finance_id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    ceo_remarks?: string;
}
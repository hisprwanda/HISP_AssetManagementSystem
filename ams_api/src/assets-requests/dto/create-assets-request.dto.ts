import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetRequestDto {
    @ApiProperty({ description: 'UUID of the user making the request' })
    @IsUUID()
    @IsNotEmpty()
    requester_id: string;

    @ApiProperty({ example: 'Need a new monitor for the data team' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ example: 'Q3-IT-001' })
    @IsOptional()
    @IsString()
    budget_code?: string;
}
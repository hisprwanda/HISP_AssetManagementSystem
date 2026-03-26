import { IsString, IsNotEmpty, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class DisposeAssetDto {
    @ApiProperty({ example: '2026-01-01', description: 'The exact date the asset left the organization' })
    @IsDateString()
    disposal_date: string;

    @ApiProperty({ example: 150.00, description: 'The amount recovered from the sale (0 if destroyed/donated)' })
    @IsNumber()
    @Min(0)
    disposal_value: number;

    @ApiProperty({ example: 'Sold at auction after 5 years of use', description: 'Reason for retirement' })
    @IsString()
    @IsNotEmpty()
    disposal_reason: string;
}
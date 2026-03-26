import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Laptops', description: 'Name of the asset category' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 33.33, description: 'Annual straight-line depreciation percentage' })
    @IsNumber()
    @Min(0)
    @Max(100)
    depreciation_rate: number;
}
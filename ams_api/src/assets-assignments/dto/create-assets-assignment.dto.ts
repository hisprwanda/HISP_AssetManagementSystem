import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetAssignmentDto {
    @ApiProperty({ description: 'The UUID of the asset being assigned' })
    @IsUUID()
    @IsNotEmpty()
    asset_id: string;

    @ApiProperty({ description: 'The UUID of the user receiving the asset' })
    @IsUUID()
    @IsNotEmpty()
    user_id: string;

    @ApiPropertyOptional({ example: 'Brand new, sealed in box' })
    @IsOptional()
    @IsString()
    condition_on_assign?: string;
}
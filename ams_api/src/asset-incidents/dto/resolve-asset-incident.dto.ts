import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveIncidentDto {
    @ApiProperty({ enum: ['ACCEPTED', 'DENIED'] })
    @IsString()
    @IsIn(['ACCEPTED', 'DENIED'])
    resolution: 'ACCEPTED' | 'DENIED';

    @ApiProperty({ example: 'Negligence found. User must pay penalty.' })
    @IsString()
    @IsNotEmpty()
    remarks: string;
}
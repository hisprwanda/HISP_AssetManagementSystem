import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveIncidentDto {
  @ApiProperty({
    enum: [
      'RESOLVED_FIXED',
      'RESOLVED_REPLACED',
      'REJECTED_LIABILITY',
      'CEO_REVIEW',
    ],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'RESOLVED_FIXED',
    'RESOLVED_REPLACED',
    'REJECTED_LIABILITY',
    'CEO_REVIEW',
  ])
  incident_status: string;

  @ApiProperty({
    example: 'IN_STOCK',
    enum: ['IN_STOCK', 'ASSIGNED', 'DISPOSED', 'BROKEN'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['IN_STOCK', 'ASSIGNED', 'DISPOSED', 'BROKEN'])
  new_asset_status: string;

  @ApiProperty({ example: 'Replaced screen and verified functionality.' })
  @IsString()
  @IsNotEmpty()
  resolution_notes: string;
}

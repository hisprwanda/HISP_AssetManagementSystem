import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForwardIncidentDto {
  @ApiProperty({
    example: 'Initial investigation findings. Evidence suggests negligence.',
  })
  @IsString()
  @IsNotEmpty()
  remarks: string;
}

import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    example: 'IT Operations',
    description: 'Name of the department',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: ['Directorate', 'Country Office'],
    description: 'Organizational level',
  })
  @IsString()
  @IsIn(['Directorate', 'Country Office'])
  type: string;
}

import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
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
    enum: ['Directorate', 'Country Portfolio'],
    description: 'Organizational level',
  })
  @IsString()
  @IsIn(['Directorate', 'Country Portfolio'])
  type: string;

  @ApiProperty({
    enum: ['Active', 'Inactive'],
    description: 'Status of the department',
    required: false,
    default: 'Active',
  })
  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}

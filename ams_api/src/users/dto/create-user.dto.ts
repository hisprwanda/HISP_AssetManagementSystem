import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsUUID,
  IsIn,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'user@hisp.tech' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'pass12',
    description: 'Must be exactly 6 characters long',
  })
  @IsString()
  @Length(6, 6)
  password: string;

  @ApiProperty({ example: '+250788123456' })
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({
    enum: [
      'Staff',
      'HOD',
      'Admin and Finance Director',
      'Finance Officer',
      'Operations Officer',
      'SYSTEM_ADMIN',
      'Office of the CEO',
      'HR',
      'Procurement',
    ],
    description: 'The precise organizational role of the user',
  })
  @IsString()
  @IsIn([
    'Staff',
    'HOD',
    'Admin and Finance Director',
    'Finance Officer',
    'Operations Officer',
    'SYSTEM_ADMIN',
    'Office of the CEO',
    'HR',
    'Procurement',
  ])
  role: string;

  @ApiProperty({
    description: 'The UUID of the department the user belongs to',
  })
  @IsUUID()
  department_id: string;
}

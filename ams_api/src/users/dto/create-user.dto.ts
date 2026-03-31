import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsUUID,
  IsIn,
  MinLength,
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

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password_hash: string;

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

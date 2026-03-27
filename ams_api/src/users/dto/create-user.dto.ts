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
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'jdoe@hisp.rw' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password_hash: string;

  @ApiProperty({
    enum: ['Staff', 'HOD', 'Admin and Finance', 'Office of the CEO'],
    description: 'The precise organizational role of the user',
  })
  @IsString()
  @IsIn(['Staff', 'HOD', 'Admin and Finance', 'Office of the CEO'])
  role: string;

  @ApiProperty({
    description: 'The UUID of the department the user belongs to',
  })
  @IsUUID()
  department_id: string;
}

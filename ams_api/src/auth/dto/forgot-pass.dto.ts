import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPassDto {
    @ApiProperty({ example: 'example@hisp.tech' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

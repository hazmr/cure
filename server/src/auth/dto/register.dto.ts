import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'patient@cure.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  password!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;
}


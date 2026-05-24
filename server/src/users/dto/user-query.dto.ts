import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../../database/enums';

export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}


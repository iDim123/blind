import { IsString, IsInt, MinLength, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AVATAR_COUNT, NICKNAME_MIN_LENGTH, NICKNAME_MAX_LENGTH } from '@blind/shared';

export class SetProfileDto {
  @ApiProperty({ example: 'Олег', minLength: NICKNAME_MIN_LENGTH, maxLength: NICKNAME_MAX_LENGTH })
  @IsString()
  @MinLength(NICKNAME_MIN_LENGTH)
  @MaxLength(NICKNAME_MAX_LENGTH)
  nickname: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: AVATAR_COUNT })
  @IsInt()
  @Min(1)
  @Max(AVATAR_COUNT)
  avatarId: number;
}
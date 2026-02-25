import { IsString, IsInt, IsBoolean, IsOptional, MinLength, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_PLAYERS } from '@blind/shared';

export class CreateGameDto {
  @ApiProperty({ example: 'Тренинг №1' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  @Max(MAX_PLAYERS)
  playersCount: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  groupsCount: number;

  @ApiPropertyOptional({ example: '4,4,4' })
  @IsOptional()
  @IsString()
  playersByGroups?: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  stepsCount: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isOpen: boolean;
}
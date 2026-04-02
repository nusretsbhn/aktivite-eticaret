import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ActivityCategory } from '../../../entities/enums';

export class UpsertActivityDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActivityCategory)
  category!: ActivityCategory;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;

  @IsInt()
  @Min(1)
  maxCapacity!: number;

  @IsString()
  priceAdult!: string;

  @IsString()
  priceChild!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}


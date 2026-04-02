import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

import { ScheduleStatus } from '../../../entities/enums';

const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UpsertScheduleDto {
  @Matches(UUID_LIKE_REGEX, { message: 'activityId must be a UUID' })
  activityId!: string;

  @IsString()
  date!: string;

  @IsString()
  departureTime!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableSlots?: number;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

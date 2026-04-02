import { IsEnum } from 'class-validator';

import { BookingStatus } from '../../../entities/enums';

export class AdminUpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}


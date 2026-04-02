import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { PaymentMethod } from '../../../entities/enums';

const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateBookingDto {
  @Matches(UUID_LIKE_REGEX, { message: 'scheduleId must be a UUID' })
  scheduleId!: string;

  @IsString()
  activityId!: string;

  @IsString()
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  customerPhone!: string;

  @IsInt()
  @Min(0)
  adultCount!: number;

  @IsInt()
  @Min(0)
  childCount!: number;

  @IsString()
  totalAmount!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}


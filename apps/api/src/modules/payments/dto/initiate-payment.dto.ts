import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../../../entities/enums';

export class InitiatePaymentDto {
  @IsString()
  bookingReference!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsString()
  amount!: string;

  @IsOptional()
  @IsString()
  currency?: string;
}


import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../../entities/enums';

export class PaymentWebhookDto {
  @IsString()
  bookingReference!: string;

  @IsString()
  provider!: string;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsString()
  providerTransactionId?: string;

  @IsOptional()
  providerResponse?: unknown;
}


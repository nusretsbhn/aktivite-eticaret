import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaymentStatus } from '../../../entities/enums';

export class AdminUpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  providerTransactionId?: string;
}


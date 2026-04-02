import { createHmac, timingSafeEqual } from 'node:crypto';

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { PaymentWebhookDto } from './dto/payment-webhook.dto';

export type WebhookSignatureStrategy = {
  supports(provider: string): boolean;
  verify(dto: PaymentWebhookDto, signature?: string): void;
};

function safeCompareHex(expectedHex: string, providedHex: string): boolean {
  const left = Buffer.from(expectedHex);
  const right = Buffer.from(providedHex);
  return left.length === right.length && timingSafeEqual(left, right);
}

function buildSignaturePayload(dto: PaymentWebhookDto): string {
  return [
    dto.bookingReference,
    dto.provider,
    dto.status,
    dto.providerTransactionId ?? '',
  ].join('|');
}

@Injectable()
export class IyzicoWebhookSignatureStrategy implements WebhookSignatureStrategy {
  constructor(private readonly configService: ConfigService) {}

  supports(provider: string): boolean {
    return provider.toLowerCase() === 'iyzico';
  }

  verify(dto: PaymentWebhookDto, signature?: string): void {
    const secret =
      this.configService.get<string>('IYZICO_WEBHOOK_SECRET') ??
      this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) return;
    if (!signature) throw new BadRequestException('Missing webhook signature');

    const expected = createHmac('sha256', secret).update(buildSignaturePayload(dto)).digest('hex');
    if (!safeCompareHex(expected, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}

@Injectable()
export class StripeWebhookSignatureStrategy implements WebhookSignatureStrategy {
  constructor(private readonly configService: ConfigService) {}

  supports(provider: string): boolean {
    return provider.toLowerCase() === 'stripe';
  }

  verify(dto: PaymentWebhookDto, signature?: string): void {
    const secret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ??
      this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) return;
    if (!signature) throw new BadRequestException('Missing webhook signature');

    const expected = createHmac('sha256', secret).update(buildSignaturePayload(dto)).digest('hex');
    if (!safeCompareHex(expected, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}

@Injectable()
export class DefaultWebhookSignatureStrategy implements WebhookSignatureStrategy {
  constructor(private readonly configService: ConfigService) {}

  supports(_provider: string): boolean {
    return true;
  }

  verify(dto: PaymentWebhookDto, signature?: string): void {
    const secret = this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) return;
    if (!signature) throw new BadRequestException('Missing webhook signature');

    const expected = createHmac('sha256', secret).update(buildSignaturePayload(dto)).digest('hex');
    if (!safeCompareHex(expected, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}


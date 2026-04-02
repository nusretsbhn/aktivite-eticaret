import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BookingStatus, PaymentMethod, PaymentStatus } from '../../entities/enums';
import { Payment } from '../../entities/payment.entity';
import { TicketsService } from '../tickets/tickets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TicketsAssetsQueueService } from '../tickets/tickets-assets.queue.service';
import { BookingsService } from '../bookings/bookings.service';
import type { InitiatePaymentDto } from './dto/initiate-payment.dto';
import type { PaymentWebhookDto } from './dto/payment-webhook.dto';
import type { AdminUpdatePaymentStatusDto } from './dto/admin-update-payment-status.dto';
import type { WebhookSignatureStrategy } from './webhook-signature.strategy';
import {
  DefaultWebhookSignatureStrategy,
  IyzicoWebhookSignatureStrategy,
  StripeWebhookSignatureStrategy,
} from './webhook-signature.strategy';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly bookingsService: BookingsService,
    private readonly ticketsService: TicketsService,
    private readonly notificationsService: NotificationsService,
    private readonly iyzicoWebhookSignatureStrategy: IyzicoWebhookSignatureStrategy,
    private readonly stripeWebhookSignatureStrategy: StripeWebhookSignatureStrategy,
    private readonly defaultWebhookSignatureStrategy: DefaultWebhookSignatureStrategy,
    @Optional() private readonly ticketsAssetsQueue?: TicketsAssetsQueueService,
  ) {}

  private isValidPaymentTransition(current: PaymentStatus, next: PaymentStatus): boolean {
    if (current === next) return true;
    const rules: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.pending]: [PaymentStatus.processing, PaymentStatus.completed, PaymentStatus.failed],
      [PaymentStatus.processing]: [PaymentStatus.completed, PaymentStatus.failed],
      [PaymentStatus.completed]: [PaymentStatus.refunded],
      [PaymentStatus.failed]: [],
      [PaymentStatus.refunded]: [],
    };
    return rules[current].includes(next);
  }

  private getWebhookStrategy(provider: string): WebhookSignatureStrategy {
    const strategies: WebhookSignatureStrategy[] = [
      this.iyzicoWebhookSignatureStrategy,
      this.stripeWebhookSignatureStrategy,
      this.defaultWebhookSignatureStrategy,
    ];
    return strategies.find((strategy) => strategy.supports(provider)) ?? this.defaultWebhookSignatureStrategy;
  }

  async initiate(dto: InitiatePaymentDto): Promise<{ paymentId: string; provider: string; redirectUrl?: string }> {
    const booking = await this.bookingsService.findOneByReference(dto.bookingReference);
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.pending) {
      throw new BadRequestException('Booking is not payable');
    }

    const amount = dto.amount;
    const currency = dto.currency ?? 'TRY';

    // Şimdilik provider simülasyonu.
    const provider = dto.paymentMethod === 'credit_card' ? 'iyzico' : 'manual';

    let payment = await this.paymentRepo.findOne({
      where: { booking: { bookingReference: dto.bookingReference } },
      relations: ['booking'],
    });

    if (!payment) {
      payment = this.paymentRepo.create({
        booking,
        amount,
        currency,
        method: dto.paymentMethod,
        status: PaymentStatus.pending,
        provider,
      });
    } else {
      payment.amount = amount;
      payment.currency = currency;
      payment.method = dto.paymentMethod;
      payment.status = PaymentStatus.pending;
      payment.provider = provider;
      payment.providerTransactionId = null;
      payment.providerResponse = null;
      payment.paidAt = null;
    }

    payment = await this.paymentRepo.save(payment);

    if (dto.paymentMethod === PaymentMethod.credit_card) {
      return {
        paymentId: payment.id,
        provider,
        redirectUrl: `${process.env.APP_URL ?? ''}/payment/checkout?paymentId=${payment.id}`,
      };
    }

    return {
      paymentId: payment.id,
      provider,
    };
  }

  async webhook(dto: PaymentWebhookDto, signature?: string): Promise<Payment & { ticketToken?: string }> {
    this.getWebhookStrategy(dto.provider).verify(dto, signature);

    const booking = await this.bookingsService.findOneByReference(dto.bookingReference);
    if (!booking) throw new NotFoundException('Booking not found');

    const bookingStatusAfterPayment =
      dto.status === PaymentStatus.completed
        ? BookingStatus.confirmed
        : dto.status === PaymentStatus.refunded
          ? BookingStatus.refunded
          : dto.status === PaymentStatus.failed
            ? BookingStatus.cancelled
            : null;
    if (
      bookingStatusAfterPayment &&
      !this.bookingsService.canTransitionStatus(booking.status, bookingStatusAfterPayment)
    ) {
      throw new BadRequestException(
        `Invalid booking status transition: ${booking.status} -> ${bookingStatusAfterPayment}`,
      );
    }

    const payment = await this.paymentRepo.findOne({
      where: { booking: { bookingReference: dto.bookingReference } },
      relations: ['booking'],
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const isSameStatus = payment.status === dto.status;
    const sameProviderTx =
      (dto.providerTransactionId ?? null) === (payment.providerTransactionId ?? null);
    if (isSameStatus && sameProviderTx) {
      return payment as Payment & { ticketToken?: string };
    }

    payment.provider = dto.provider;
    payment.providerTransactionId = dto.providerTransactionId ?? payment.providerTransactionId ?? null;
    payment.providerResponse = dto.providerResponse ?? payment.providerResponse ?? null;
    if (!this.isValidPaymentTransition(payment.status, dto.status)) {
      throw new BadRequestException(`Invalid payment status transition: ${payment.status} -> ${dto.status}`);
    }

    payment.status = dto.status;
    payment.paidAt = dto.status === PaymentStatus.completed ? new Date() : null;

    const updated = await this.paymentRepo.save(payment);
    let ticketToken: string | undefined;

    if (dto.status === PaymentStatus.completed) {
      // Provider tamamlandı -> booking confirmed
      await this.bookingsService.updateStatusByReference(dto.bookingReference, BookingStatus.confirmed);
      // Booking confirmed olduktan sonra ticket oluştur.
      const ticket = await this.ticketsService.createForBooking(dto.bookingReference);
      ticketToken = ticket.token;

      const bookingAfter = await this.bookingsService.findOneByReference(dto.bookingReference);
      const schedule = bookingAfter?.schedule;
      const activity = bookingAfter?.activity;

      if (bookingAfter && schedule && activity) {
        await this.notificationsService.sendBookingConfirmed({
          bookingReference: bookingAfter.bookingReference,
          activityName: activity.name,
          date: schedule.date,
          time: schedule.departureTime,
          ticketToken: ticket.token,
          customerPhone: bookingAfter.customerPhone,
          customerEmail: bookingAfter.customerEmail,
        });
      }

      // Payment completed -> assets generation job enqueue.
      if (ticketToken) {
        void this.ticketsAssetsQueue?.enqueueGenerateAssets(ticketToken);
      }
    }

    return {
      ...updated,
      ticketToken,
    } as Payment & { ticketToken?: string };
  }

  async adminUpdateStatus(
    bookingReference: string,
    dto: AdminUpdatePaymentStatusDto,
  ): Promise<Payment & { ticketToken?: string }> {
    const booking = await this.bookingsService.findOneByReference(bookingReference);
    if (!booking) throw new NotFoundException('Booking not found');

    const bookingStatusAfterPayment =
      dto.status === PaymentStatus.completed
        ? BookingStatus.confirmed
        : dto.status === PaymentStatus.refunded
          ? BookingStatus.refunded
          : dto.status === PaymentStatus.failed
            ? BookingStatus.cancelled
            : null;
    if (
      bookingStatusAfterPayment &&
      !this.bookingsService.canTransitionStatus(booking.status, bookingStatusAfterPayment)
    ) {
      throw new BadRequestException(
        `Invalid booking status transition: ${booking.status} -> ${bookingStatusAfterPayment}`,
      );
    }

    const payment = await this.paymentRepo.findOne({
      where: { booking: { bookingReference } },
      relations: ['booking'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (!this.isValidPaymentTransition(payment.status, dto.status)) {
      throw new BadRequestException(`Invalid payment status transition: ${payment.status} -> ${dto.status}`);
    }

    payment.status = dto.status;
    payment.provider = dto.provider ?? payment.provider;
    payment.providerTransactionId = dto.providerTransactionId ?? payment.providerTransactionId ?? null;
    payment.paidAt = dto.status === PaymentStatus.completed ? new Date() : null;

    const updated = await this.paymentRepo.save(payment);
    let ticketToken: string | undefined;

    if (dto.status === PaymentStatus.completed) {
      await this.bookingsService.updateStatusByReference(bookingReference, BookingStatus.confirmed);
      const ticket = await this.ticketsService.createForBooking(bookingReference);
      ticketToken = ticket.token;
    } else if (dto.status === PaymentStatus.refunded) {
      await this.bookingsService.updateStatusByReference(bookingReference, BookingStatus.refunded);
    } else if (dto.status === PaymentStatus.failed) {
      await this.bookingsService.updateStatusByReference(bookingReference, BookingStatus.cancelled);
    }

    return { ...updated, ticketToken } as Payment & { ticketToken?: string };
  }
}


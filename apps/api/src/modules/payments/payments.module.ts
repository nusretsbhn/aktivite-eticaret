import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsModule } from '../bookings/bookings.module';
import { Payment } from '../../entities/payment.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  DefaultWebhookSignatureStrategy,
  IyzicoWebhookSignatureStrategy,
  StripeWebhookSignatureStrategy,
} from './webhook-signature.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), AuthModule, BookingsModule, TicketsModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    JwtAuthGuard,
    RolesGuard,
    IyzicoWebhookSignatureStrategy,
    StripeWebhookSignatureStrategy,
    DefaultWebhookSignatureStrategy,
  ],
})
export class PaymentsModule {}


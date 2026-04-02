import { Body, Controller, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/enums';
import { AdminUpdatePaymentStatusDto } from './dto/admin-update-payment-status.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(dto);
  }

  @Post('webhook')
  webhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.paymentsService.webhook(dto, signature);
  }

  @Patch('admin/:bookingReference/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  adminUpdateStatus(
    @Param('bookingReference') bookingReference: string,
    @Body() dto: AdminUpdatePaymentStatusDto,
  ) {
    return this.paymentsService.adminUpdateStatus(bookingReference, dto);
  }
}


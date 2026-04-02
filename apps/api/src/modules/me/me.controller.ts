import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, type CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BookingsService } from '../bookings/bookings.service';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';

@Controller('me')
export class MeController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @UseGuards(JwtAuthGuard)
  getMyBookings(@CurrentUser() user: CurrentUserPayload) {
    return this.bookingsService.findByUserId(user.sub);
  }

  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  createMyBooking(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(dto, user.sub);
  }
}


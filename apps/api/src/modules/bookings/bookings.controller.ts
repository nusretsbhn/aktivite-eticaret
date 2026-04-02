import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/enums';
import { AdminUpdateBookingStatusDto } from './dto/admin-update-booking-status.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @Body() dto: CreateBookingDto,
    @Req() req: { user?: CurrentUserPayload },
  ) {
    return this.bookingsService.create(dto, req.user?.sub);
  }

  @Get(':reference')
  findByReference(@Param('reference') reference: string) {
    return this.bookingsService.findByReference(reference);
  }

  @Patch('admin/:reference/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  adminUpdateStatus(
    @Param('reference') reference: string,
    @Body() dto: AdminUpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatusByReference(reference, dto.status);
  }
}


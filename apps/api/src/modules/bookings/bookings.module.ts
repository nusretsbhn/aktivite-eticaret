import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '../../entities/booking.entity';
import { Schedule } from '../../entities/schedule.entity';
import { Activity } from '../../entities/activity.entity';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Schedule, Activity, User]), AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService, OptionalJwtAuthGuard, JwtAuthGuard, RolesGuard],
  exports: [BookingsService],
})
export class BookingsModule {}


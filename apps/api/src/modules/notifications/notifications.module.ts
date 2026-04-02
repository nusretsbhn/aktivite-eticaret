import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationLog } from '../../entities/notification-log.entity';
import { Booking } from '../../entities/booking.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog, Booking]), AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, JwtAuthGuard, RolesGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}


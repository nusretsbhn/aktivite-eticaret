import { Module } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { MeController } from './me.controller';

@Module({
  imports: [AuthModule, BookingsModule],
  controllers: [MeController],
  providers: [JwtAuthGuard],
})
export class MeModule {}


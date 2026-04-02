import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Booking } from '../../entities/booking.entity';
import { Activity } from '../../entities/activity.entity';
import { Ticket } from '../../entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Activity, Ticket])],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}


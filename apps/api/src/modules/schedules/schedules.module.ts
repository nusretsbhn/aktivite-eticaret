import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { Activity } from '../../entities/activity.entity';
import { Schedule } from '../../entities/schedule.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Schedule]), AuthModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, JwtAuthGuard, RolesGuard],
})
export class SchedulesModule {}

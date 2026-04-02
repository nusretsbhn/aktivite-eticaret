import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity } from '../../entities/activity.entity';
import { ActivitiesSeedService } from './activities.seed';
import { Schedule } from '../../entities/schedule.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Schedule]), AuthModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitiesSeedService, JwtAuthGuard, RolesGuard],
})
export class ActivitiesModule {}


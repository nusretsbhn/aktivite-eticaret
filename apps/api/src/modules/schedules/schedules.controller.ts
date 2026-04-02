import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities/enums';
import { SchedulesService } from './schedules.service';
import { Schedule } from '../../entities/schedule.entity';
import { UpsertScheduleDto } from './dto/upsert-schedule.dto';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('activities/:slug/schedules')
  getByActivity(
    @Param('slug') slug: string,
    @Query('date') date?: string,
  ): Promise<Schedule[]> {
    return this.schedulesService.getSchedulesByActivitySlug(slug, date);
  }

  @Get('schedules/:id/availability')
  getAvailability(@Param('id') id: string) {
    return this.schedulesService.getAvailability(id);
  }

  @Post('admin/schedules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  createAdmin(@Body() dto: UpsertScheduleDto): Promise<Schedule> {
    return this.schedulesService.createForAdmin(dto);
  }

  @Patch('admin/schedules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  updateAdmin(
    @Param('id') id: string,
    @Body() dto: Partial<UpsertScheduleDto>,
  ): Promise<Schedule> {
    return this.schedulesService.updateForAdmin(id, dto);
  }
}

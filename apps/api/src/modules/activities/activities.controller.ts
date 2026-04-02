import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../entities/enums';
import { ActivitiesService } from './activities.service';
import { Activity } from '../../entities/activity.entity';
import { UpsertActivityDto } from './dto/upsert-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  getAll(): Promise<Activity[]> {
    return this.activitiesService.getActiveActivities();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  getAllAdmin(): Promise<Activity[]> {
    return this.activitiesService.getAllForAdmin();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  createAdmin(@Body() dto: UpsertActivityDto): Promise<Activity> {
    return this.activitiesService.createForAdmin(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  updateAdmin(@Param('id') id: string, @Body() dto: Partial<UpsertActivityDto>): Promise<Activity> {
    return this.activitiesService.updateForAdmin(id, dto);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<Activity> {
    return this.activitiesService.getBySlug(slug);
  }
}


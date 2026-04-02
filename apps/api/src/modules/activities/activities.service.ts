import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Activity } from '../../entities/activity.entity';
import type { UpsertActivityDto } from './dto/upsert-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(@InjectRepository(Activity) private readonly activityRepo: Repository<Activity>) {}

  async getActiveActivities(): Promise<Activity[]> {
    return this.activityRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async getBySlug(slug: string): Promise<Activity> {
    const found = await this.activityRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!found) throw new NotFoundException('Activity not found');
    return found;
  }

  async getAllForAdmin(): Promise<Activity[]> {
    return this.activityRepo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createForAdmin(dto: UpsertActivityDto): Promise<Activity> {
    const activity = this.activityRepo.create({
      ...dto,
      currency: dto.currency ?? 'TRY',
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      shortDescription: dto.shortDescription ?? null,
      description: dto.description ?? null,
      minAge: dto.minAge ?? null,
    });
    return this.activityRepo.save(activity);
  }

  async updateForAdmin(id: string, dto: Partial<UpsertActivityDto>): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    Object.assign(activity, dto);
    return this.activityRepo.save(activity);
  }
}


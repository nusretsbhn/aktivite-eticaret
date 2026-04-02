import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Activity } from '../../entities/activity.entity';
import { Schedule } from '../../entities/schedule.entity';
import type { UpsertScheduleDto } from './dto/upsert-schedule.dto';

export type AvailabilityResponse = {
  scheduleId: string;
  availableSlots: number;
};

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async getSchedulesByActivitySlug(
    slug: string,
    date?: string,
  ): Promise<Schedule[]> {
    const activity = await this.activityRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const qb = this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoin('s.activity', 'a')
      .where('a.id = :activityId', { activityId: activity.id });

    if (date) {
      qb.andWhere('s.date = :date', { date });
    }

    qb.orderBy('s.departure_time', 'ASC');

    return qb.getMany();
  }

  async getAvailability(scheduleId: string): Promise<AvailabilityResponse> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id: scheduleId },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    return {
      scheduleId: schedule.id,
      availableSlots: schedule.availableSlots,
    };
  }

  async createForAdmin(dto: UpsertScheduleDto): Promise<Schedule> {
    const activity = await this.activityRepo.findOne({
      where: { id: dto.activityId },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const schedule = this.scheduleRepo.create({
      activity,
      date: dto.date,
      departureTime: dto.departureTime,
      capacity: dto.capacity,
      availableSlots: dto.availableSlots ?? dto.capacity,
      status: dto.status,
      notes: dto.notes ?? null,
    });
    return this.scheduleRepo.save(schedule);
  }

  async updateForAdmin(
    id: string,
    dto: Partial<UpsertScheduleDto>,
  ): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['activity'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    if (dto.activityId) {
      const activity = await this.activityRepo.findOne({
        where: { id: dto.activityId },
      });
      if (!activity) throw new NotFoundException('Activity not found');
      schedule.activity = activity;
    }

    if (dto.date !== undefined) schedule.date = dto.date;
    if (dto.departureTime !== undefined)
      schedule.departureTime = dto.departureTime;
    if (dto.capacity !== undefined) schedule.capacity = dto.capacity;
    if (dto.availableSlots !== undefined)
      schedule.availableSlots = dto.availableSlots;
    if (dto.status !== undefined) schedule.status = dto.status;
    if (dto.notes !== undefined) schedule.notes = dto.notes ?? null;

    return this.scheduleRepo.save(schedule);
  }
}

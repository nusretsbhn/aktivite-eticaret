import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Activity } from '../../entities/activity.entity';
import { Schedule } from '../../entities/schedule.entity';
import { ActivityCategory, ScheduleStatus } from '../../entities/enums';

@Injectable()
export class ActivitiesSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Schedule) private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async onModuleInit() {
    // DB boşsa demo seed yap.
    const count = await this.activityRepo.count();
    if (count > 0) return;

    const activity = this.activityRepo.create({
      slug: 'tekne-turu',
      name: 'Tekne Turu',
      shortDescription: 'Bodrum’un mavi sularında unutulmaz bir gün',
      description: 'Gün boyu süren, şık bir tekne deneyimi...',
      category: ActivityCategory.boat_tour,
      durationMinutes: 240,
      minAge: 0,
      maxCapacity: 30,
      priceAdult: '250.00',
      priceChild: '150.00',
      currency: 'TRY',
      images: [],
      includes: [],
      excludes: [],
      meetingPoint: 'Bodrum Marina',
      whatToBring: 'Güneş kremi, şapka',
      cancellationPolicy: '48 saat öncesine kadar ücretsiz iptal',
      isActive: true,
      sortOrder: 0,
    });
    const savedActivity = await this.activityRepo.save(activity);

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const date = tomorrow.toISOString().slice(0, 10);

    const schedule = this.scheduleRepo.create({
      activity: savedActivity,
      date,
      departureTime: '10:00:00',
      capacity: 30,
      availableSlots: 30,
      status: ScheduleStatus.open,
      notes: null,
    });

    await this.scheduleRepo.save(schedule);
  }
}


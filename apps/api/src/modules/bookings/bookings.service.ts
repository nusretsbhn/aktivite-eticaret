import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Booking } from '../../entities/booking.entity';
import { Activity } from '../../entities/activity.entity';
import { Schedule } from '../../entities/schedule.entity';
import { User } from '../../entities/user.entity';
import { BookingStatus, ScheduleStatus } from '../../entities/enums';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Schedule) private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private generateReference() {
    const rand = Math.floor(Math.random() * 90000 + 10000);
    return `BDR-2026-${rand}`;
  }

  canTransitionStatus(current: BookingStatus, next: BookingStatus): boolean {
    if (current === next) return true;
    const rules: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.pending]: [BookingStatus.confirmed, BookingStatus.cancelled],
      [BookingStatus.confirmed]: [BookingStatus.completed, BookingStatus.refunded, BookingStatus.cancelled],
      [BookingStatus.completed]: [BookingStatus.refunded],
      [BookingStatus.cancelled]: [],
      [BookingStatus.refunded]: [],
    };
    return rules[current].includes(next);
  }

  async create(dto: CreateBookingDto, userId?: string): Promise<Booking> {
    const activity = await this.activityRepo.findOne({ where: { id: dto.activityId, isActive: true } });
    if (!activity) throw new BadRequestException('Invalid activity');
    const user = userId ? await this.userRepo.findOne({ where: { id: userId } }) : null;

    const peopleCount = dto.adultCount + dto.childCount;
    if (peopleCount <= 0) throw new BadRequestException('At least one person is required');

    return this.dataSource.transaction(async (manager) => {
      const scheduleRepo = manager.getRepository(Schedule);
      const bookingRepo = manager.getRepository(Booking);

      // Kapasite yarış koşullarını önlemek için satır kilidi.
      const schedule = await scheduleRepo
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id', { id: dto.scheduleId })
        .getOne();

      if (!schedule) throw new BadRequestException('Invalid schedule');

      if (schedule.availableSlots < peopleCount) {
        throw new ConflictException('No available slots');
      }

      schedule.availableSlots -= peopleCount;
      if (schedule.availableSlots === 0) schedule.status = ScheduleStatus.full;
      await scheduleRepo.save(schedule);

      let reference = this.generateReference();
      while (await bookingRepo.findOne({ where: { bookingReference: reference } })) {
        reference = this.generateReference();
      }

      const booking = bookingRepo.create({
        bookingReference: reference,
        schedule,
        activity,
        user,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        adultCount: dto.adultCount,
        childCount: dto.childCount,
        totalAmount: dto.totalAmount,
        status: BookingStatus.pending,
        paymentMethod: dto.paymentMethod,
        specialRequests: dto.specialRequests ?? null,
      });

      return bookingRepo.save(booking);
    });
  }

  async findByReference(reference: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { bookingReference: reference },
      relations: ['activity', 'schedule'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateStatusByReference(reference: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { bookingReference: reference } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!this.canTransitionStatus(booking.status, status)) {
      throw new BadRequestException(`Invalid booking status transition: ${booking.status} -> ${status}`);
    }
    booking.status = status;
    return this.bookingRepo.save(booking);
  }

  async findOneByReference(reference: string): Promise<Booking | null> {
    return this.bookingRepo.findOne({
      where: { bookingReference: reference },
      relations: ['activity', 'schedule'],
    });
  }

  async findOneByReferenceOrFail(reference: string): Promise<Booking> {
    const booking = await this.findOneByReference(reference);
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getScheduleAndActivityForBooking(reference: string) {
    const booking = await this.findOneByReferenceOrFail(reference);
    if (!booking.schedule || !booking.activity) {
      throw new NotFoundException('Booking relations not found');
    }
    return booking;
  }

  async findByUserId(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { user: { id: userId } },
      relations: ['activity', 'schedule', 'user'],
      order: { createdAt: 'DESC' },
    });
  }
}


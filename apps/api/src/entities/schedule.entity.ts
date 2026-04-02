import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScheduleStatus } from './enums';
import { Activity } from './activity.entity';
import { Booking } from './booking.entity';

@Entity({ name: 'schedules' })
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date', name: 'date' })
  date!: string;

  @Column({ type: 'time', name: 'departure_time' })
  departureTime!: string;

  @Column({ type: 'int', name: 'capacity' })
  capacity!: number;

  @Column({ type: 'int', name: 'available_slots' })
  availableSlots!: number;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    name: 'status',
    default: ScheduleStatus.open,
  })
  status!: ScheduleStatus;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes?: string | null;

  @ManyToOne(() => Activity, (activity) => activity.schedules, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity!: Activity;

  @OneToMany(() => Booking, (booking) => booking.schedule)
  bookings!: Booking[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}


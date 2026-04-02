import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Activity } from './activity.entity';
import { BookingStatus, PaymentMethod } from './enums';
import { Schedule } from './schedule.entity';
import { User } from './user.entity';

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true, name: 'booking_reference' })
  bookingReference!: string;

  @ManyToOne(() => User, (user) => user.bookings, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @ManyToOne(() => Schedule, (schedule) => schedule.bookings, { nullable: false })
  @JoinColumn({ name: 'schedule_id' })
  schedule!: Schedule;

  @ManyToOne(() => Activity, (activity) => activity.bookings, { nullable: false })
  @JoinColumn({ name: 'activity_id' })
  activity!: Activity;

  @Column({ type: 'varchar', name: 'customer_name' })
  customerName!: string;

  @Column({ type: 'varchar', name: 'customer_email' })
  customerEmail!: string;

  @Column({ type: 'varchar', name: 'customer_phone' })
  customerPhone!: string;

  @Column({ type: 'int', name: 'adult_count' })
  adultCount!: number;

  @Column({ type: 'int', name: 'child_count' })
  childCount!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount!: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    name: 'status',
    default: BookingStatus.pending,
  })
  status!: BookingStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'text', name: 'special_requests', nullable: true })
  specialRequests?: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}


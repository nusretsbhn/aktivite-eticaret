import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { NotificationStatus, NotificationType } from './enums';

@Entity({ name: 'notification_logs' })
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({
    type: 'enum',
    enum: NotificationType,
    name: 'type',
  })
  type!: NotificationType;

  @Column({ type: 'varchar', name: 'recipient' })
  recipient!: string;

  @Column({ type: 'varchar', name: 'template' })
  template!: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    name: 'status',
  })
  status!: NotificationStatus;

  @Column({ type: 'jsonb', name: 'provider_response', nullable: true })
  providerResponse?: unknown | null;

  @Column({ type: 'timestamp', name: 'sent_at', nullable: true })
  sentAt?: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;
}


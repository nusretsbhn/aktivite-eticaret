import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActivityCategory } from './enums';
import { Schedule } from './schedule.entity';
import { Booking } from './booking.entity';

export type ActivityImage = { url: string; alt?: string; order: number };

@Entity({ name: 'activities' })
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true, name: 'slug' })
  slug!: string;

  @Column({ type: 'varchar', name: 'name' })
  name!: string;

  @Column({ type: 'text', name: 'short_description', nullable: true })
  shortDescription?: string | null;

  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string | null;

  @Column({
    type: 'enum',
    enum: ActivityCategory,
    name: 'category',
  })
  category!: ActivityCategory;

  @Column({ type: 'int', name: 'duration_minutes' })
  durationMinutes!: number;

  @Column({ type: 'int', name: 'min_age', nullable: true })
  minAge?: number | null;

  @Column({ type: 'int', name: 'max_capacity' })
  maxCapacity!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'price_adult',
  })
  priceAdult!: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'price_child',
  })
  priceChild!: string;

  @Column({ type: 'varchar', default: 'TRY', name: 'currency' })
  currency!: string;

  @Column({ type: 'jsonb', name: 'images', nullable: true })
  images?: ActivityImage[] | null;

  @Column({ type: 'jsonb', name: 'includes', nullable: true })
  includes?: unknown[] | null;

  @Column({ type: 'jsonb', name: 'excludes', nullable: true })
  excludes?: unknown[] | null;

  @Column({ type: 'text', name: 'meeting_point', nullable: true })
  meetingPoint?: string | null;

  @Column({ type: 'text', name: 'what_to_bring', nullable: true })
  whatToBring?: string | null;

  @Column({ type: 'text', name: 'cancellation_policy', nullable: true })
  cancellationPolicy?: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  // Relations (Faz 2'de modüller eklendikçe kullanılacak).
  @OneToMany(() => Schedule, (schedule) => schedule.activity)
  schedules!: Schedule[];

  @OneToMany(() => Booking, (booking) => booking.activity)
  bookings!: Booking[];
}


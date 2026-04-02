import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { PaymentMethod, PaymentStatus } from './enums';

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'amount' })
  amount!: string;

  @Column({ type: 'varchar', name: 'currency' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'method',
  })
  method!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    name: 'status',
  })
  status!: PaymentStatus;

  @Column({ type: 'varchar', name: 'provider' })
  provider!: string;

  @Column({ type: 'varchar', name: 'provider_transaction_id', nullable: true })
  providerTransactionId?: string | null;

  @Column({ type: 'jsonb', name: 'provider_response', nullable: true })
  providerResponse?: unknown | null;

  @Column({ type: 'timestamp', name: 'paid_at', nullable: true })
  paidAt?: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;
}


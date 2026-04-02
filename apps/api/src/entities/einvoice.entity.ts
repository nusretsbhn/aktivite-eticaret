import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { InvoiceStatus } from './enums';

@Entity({ name: 'einvoices' })
export class Einvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'varchar', name: 'invoice_number' })
  invoiceNumber!: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    name: 'status',
    default: InvoiceStatus.draft,
  })
  status!: InvoiceStatus;

  @Column({ type: 'jsonb', name: 'provider_response', nullable: true })
  providerResponse?: unknown | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;
}


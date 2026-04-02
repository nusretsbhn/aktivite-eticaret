import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'varchar', unique: true, name: 'ticket_number' })
  ticketNumber!: string;

  @Column({ type: 'text', name: 'qr_code_data' })
  qrCodeData!: string;

  @Column({ type: 'text', name: 'qr_code_url', nullable: true })
  qrCodeUrl?: string | null;

  @Column({ type: 'text', name: 'pdf_url', nullable: true })
  pdfUrl?: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_used' })
  isUsed!: boolean;

  @Column({ type: 'timestamp', name: 'used_at', nullable: true })
  usedAt?: Date | null;

  @Column({ type: 'date', name: 'valid_date' })
  validDate!: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;
}


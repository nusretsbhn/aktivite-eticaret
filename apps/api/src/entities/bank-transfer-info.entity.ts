import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Booking } from './booking.entity';

@Entity({ name: 'bank_transfer_info' })
export class BankTransferInfo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'varchar', name: 'bank_name' })
  bankName!: string;

  @Column({ type: 'varchar', name: 'iban' })
  iban!: string;

  @Column({ type: 'varchar', name: 'account_holder' })
  accountHolder!: string;

  @Column({ type: 'varchar', name: 'transfer_reference' })
  transferReference!: string;

  @Column({ type: 'timestamp', name: 'confirmed_at', nullable: true })
  confirmedAt?: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'confirmed_by' })
  confirmedBy?: User | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;
}


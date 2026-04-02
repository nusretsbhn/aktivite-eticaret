import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './enums';
import { Booking } from './booking.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true, name: 'email' })
  email!: string;

  @Column({ type: 'varchar', name: 'phone', nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.customer,
    name: 'role',
  })
  role!: UserRole;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified!: boolean;

  @Column({ type: 'varchar', name: 'refresh_token_hash', nullable: true })
  refreshTokenHash?: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings!: Booking[];
}


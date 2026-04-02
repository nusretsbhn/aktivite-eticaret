import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'settings' })
export class Setting {
  @PrimaryColumn({ type: 'varchar', name: 'key' })
  key!: string;

  @Column({ type: 'jsonb', name: 'value' })
  value!: unknown;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: true })
  createdAt?: Date | null;
}


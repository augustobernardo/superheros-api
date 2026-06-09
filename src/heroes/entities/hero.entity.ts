import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Alignment } from './alignment.entity';
import { HeroStatus } from '../enums/hero-status.enum';
import { Publisher } from './publisher.entity';

@Entity('heroes')
export class Hero {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  name!: string;

  @Column({
    type: 'simple-enum',
    enum: HeroStatus,
    default: HeroStatus.DRAFT,
  })
  status!: HeroStatus;

  @Column({ name: 'publisher_id', type: 'int', nullable: true })
  publisherId!: number | null;

  @ManyToOne(() => Publisher, { nullable: true })
  @JoinColumn({ name: 'publisher_id' })
  publisher!: Publisher | null;

  @Column({ name: 'alignment_id', type: 'int', nullable: true })
  alignmentId!: number | null;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName!: string | null;

  @Column({ name: 'height_cm', type: 'int', nullable: true })
  heightCm!: number | null;

  @Column({ name: 'weight_kg', type: 'int', nullable: true })
  weightKg!: number | null;

  @ManyToOne(() => Alignment, { nullable: true })
  @JoinColumn({ name: 'alignment_id' })
  alignment!: Alignment | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}

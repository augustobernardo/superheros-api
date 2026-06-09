import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Hero } from '../../heroes/entities/hero.entity';

@Entity('powers')
@Unique(['heroId', 'name'])
export class Power {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'hero_id' })
  heroId!: string;

  @ManyToOne(() => Hero, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hero_id' })
  hero!: Hero;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'int', nullable: true })
  value!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}

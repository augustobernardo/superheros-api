import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 11 })
  cpf!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Exclude()
  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role!: UserRole;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 255, nullable: true })
  photoUrl!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_logout_at', type: 'timestamp with time zone', nullable: true })
  lastLogoutAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}

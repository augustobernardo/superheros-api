import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('alignments')
export class Alignment {
  @PrimaryGeneratedColumn()
  id!: number; // Id as int to import alignments from CSV file without issues

  @Column({ unique: true, length: 255 })
  name!: string;
}

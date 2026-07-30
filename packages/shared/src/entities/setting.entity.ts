import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'settings' })
export class Setting {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'boolean', default: true })
  is_editable: boolean;

  @Column({ type: 'text' })
  created_at: string;

  @Column({ type: 'text' })
  updated_at: string;
}

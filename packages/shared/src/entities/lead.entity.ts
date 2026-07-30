import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'leads' })
export class Lead {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  first_name: string;

  @Column({ type: 'text', nullable: true })
  last_name?: string;

  @Column({ type: 'text', nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'text', nullable: true })
  source_reference_id?: string;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', nullable: true })
  classification?: string;

  @Column({ type: 'text', nullable: true })
  assigned_to?: string;

  @Column({ type: 'text', nullable: true })
  assigned_at?: string;

  @Column({ type: 'text', nullable: true })
  last_contacted_at?: string;

  @Column({ type: 'text', nullable: true })
  next_scheduled_action?: string;

  @Column({ type: 'text' })
  metadata: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text' })
  created_at: string;

  @Column({ type: 'text' })
  updated_at: string;
}

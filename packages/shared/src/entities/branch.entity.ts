import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'branches' })
export class Branch {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  google_maps_link?: string;

  @Column({ type: 'text', nullable: true })
  contact_number?: string;

  @Column({ type: 'text', nullable: true })
  working_hours?: string;

  @Column({ type: 'text', nullable: true })
  branch_manager?: string;

  @Column({ type: 'text', nullable: true })
  parking_info?: string;

  @Column({ type: 'text', nullable: true })
  nearby_landmarks?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text' })
  created_at: string;
}

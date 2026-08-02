import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'meetings' })
export class Meeting {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text', nullable: true })
  organizer_id?: string;

  @Column({ type: 'text' })
  meeting_type: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text' })
  scheduled_at: string;

  @Column({ type: 'integer', default: 30 })
  duration_minutes: number;

  @Column({ type: 'text', nullable: true })
  completed_at?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'integer', nullable: true })
  feedback_rating?: number;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @Column({ type: 'boolean', default: false })
  reminder_sent: boolean;

  @Column({ type: 'text' })
  metadata: string;

  @Column({ type: 'text' })
  created_at: string;

  @Column({ type: 'text' })
  updated_at: string;
}

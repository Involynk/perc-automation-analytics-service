import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'analytics_events' })
export class AnalyticsEvent {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text', nullable: true })
  lead_id?: string;

  @Column({ type: 'text' })
  event_type: string;

  @Column({ type: 'text', default: '{}' })
  event_data: string;

  @Column({ type: 'text', nullable: true })
  source?: string;

  @Column({ type: 'text' })
  created_at: string;
}

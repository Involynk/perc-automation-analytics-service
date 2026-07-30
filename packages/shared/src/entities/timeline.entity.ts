import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'timeline_events' })
export class TimelineEvent {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text' })
  event_type_id: string;

  @Column({ type: 'text' })
  actor_type: string;

  @Column({ type: 'text', nullable: true })
  actor_id?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  metadata: string;

  @Column({ type: 'text' })
  created_at: string;
}

import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'event_types' })
export class EventType {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'text' })
  created_at: string;
}

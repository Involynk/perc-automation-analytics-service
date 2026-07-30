import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  user_id: string;

  @Column({ type: 'text', nullable: true })
  lead_id?: string;

  @Column({ type: 'text' })
  notification_type: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'text', nullable: true })
  read_at?: string;

  @Column({ type: 'text', nullable: true })
  action_url?: string;

  @Column({ type: 'text' })
  priority: string;

  @Column({ type: 'text' })
  metadata: string;

  @Column({ type: 'text' })
  created_at: string;
}

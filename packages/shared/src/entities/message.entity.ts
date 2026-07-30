import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  conversation_id: string;

  @Column({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text' })
  direction: string;

  @Column({ type: 'text', nullable: true })
  channel_message_id?: string;

  @Column({ type: 'text' })
  content_type: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  template_id?: string;

  @Column({ type: 'text' })
  metadata: string;

  @Column({ type: 'text' })
  sent_at: string;

  @Column({ type: 'text', nullable: true })
  delivered_at?: string;

  @Column({ type: 'text', nullable: true })
  read_at?: string;

  @Column({ type: 'text' })
  status: string;
}

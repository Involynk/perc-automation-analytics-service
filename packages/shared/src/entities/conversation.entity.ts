import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text' })
  channel_id: string;

  @Column({ type: 'text', nullable: true })
  external_conversation_id?: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text' })
  started_at: string;

  @Column({ type: 'text', nullable: true })
  ended_at?: string;

  @Column({ type: 'text' })
  metadata: string;
}

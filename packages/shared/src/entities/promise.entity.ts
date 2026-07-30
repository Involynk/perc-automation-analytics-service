import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'promises' })
export class PromiseEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text', nullable: true })
  workflow_id?: string;

  @Column({ type: 'text' })
  promise_type: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text' })
  scheduled_at: string;

  @Column({ type: 'text', nullable: true })
  executed_at?: string;

  @Column({ type: 'text', nullable: true })
  cancelled_at?: string;

  @Column({ type: 'text', nullable: true })
  cancelled_reason?: string;

  @Column({ type: 'text' })
  payload: string;

  @Column({ type: 'text', nullable: true })
  result?: string;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  @Column({ type: 'integer', default: 3 })
  max_retries: number;

  @Column({ type: 'boolean', default: false })
  is_recurring: boolean;

  @Column({ type: 'text', nullable: true })
  recurring_interval?: string;

  @Column({ type: 'text' })
  created_at: string;

  @Column({ type: 'text' })
  updated_at: string;
}

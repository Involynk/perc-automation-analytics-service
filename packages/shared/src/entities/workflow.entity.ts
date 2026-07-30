import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'workflow_instances' })
export class WorkflowInstance {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text' })
  current_state: string;

  @Column({ type: 'text', nullable: true })
  previous_state?: string;

  @Column({ type: 'boolean', default: false })
  is_paused: boolean;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'text', nullable: true })
  completed_at?: string;

  @Column({ type: 'text' })
  metadata: string;

  @Column({ type: 'text' })
  created_at: string;

  @Column({ type: 'text' })
  updated_at: string;
}

@Entity({ name: 'workflow_history' })
export class WorkflowHistory {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  workflow_id: string;

  @Column({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text' })
  from_state: string;

  @Column({ type: 'text' })
  to_state: string;

  @Column({ type: 'text', nullable: true })
  trigger_event?: string;

  @Column({ type: 'text' })
  triggered_by: string;

  @Column({ type: 'text', nullable: true })
  triggered_by_id?: string;

  @Column({ type: 'text' })
  metadata: string;

  @Column({ type: 'text' })
  created_at: string;
}

import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'channels' })
export class Channel {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  display_name?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text' })
  config: string;

  @Column({ type: 'text' })
  created_at: string;
}

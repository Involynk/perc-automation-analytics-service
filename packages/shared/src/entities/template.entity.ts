import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'templates' })
export class Template {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  template_type: string;

  @Column({ type: 'text', nullable: true })
  channel_id?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', default: '[]' })
  variables: string;

  @Column({ type: 'text', default: 'en' })
  language: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'text', default: '{}' })
  metadata: string;

  @Column({ type: 'text' })
  created_at: string;

  @Column({ type: 'text' })
  updated_at: string;
}

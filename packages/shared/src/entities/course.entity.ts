import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  duration?: string;

  @Column({ type: 'text', nullable: true })
  eligibility?: string;

  @Column({ type: 'text', nullable: true })
  subjects?: string;

  @Column({ type: 'text', nullable: true })
  curriculum?: string;

  @Column({ type: 'text', nullable: true })
  learning_outcomes?: string;

  @Column({ type: 'text', nullable: true })
  batch_timings?: string;

  @Column({ type: 'text', nullable: true })
  faculty?: string;

  @Column({ type: 'text', nullable: true })
  brochure_url?: string;

  @Column({ type: 'text', nullable: true })
  pdf_url?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text' })
  created_at: string;
}

@Entity({ name: 'lead_courses' })
export class LeadCourse {
  @PrimaryColumn({ type: 'text' })
  lead_id: string;

  @Column({ type: 'text' })
  course_id: string;

  @Column({ type: 'text', nullable: true })
  interest_level?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text' })
  created_at: string;
}

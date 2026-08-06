import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'analytics_metrics' })
export class AnalyticsMetric {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  metric_key: string;

  @Column({ type: 'text' })
  dimension: string;

  @Column({ type: 'text' })
  period: string;

  @Column({ type: 'integer', default: 0 })
  count_value: number;

  @Column({ type: 'real', default: 0 })
  sum_value: number;

  @Column({ type: 'text' })
  updated_at: string;
}

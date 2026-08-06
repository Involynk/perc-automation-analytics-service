export class AnalyticsEventRecorded {
  constructor(
    public readonly eventType: string,
    public readonly leadId: string | null,
    public readonly source: string | null,
    public readonly eventData: Record<string, unknown>,
  ) {}
}

export class MetricUpdatedEvent {
  constructor(
    public readonly metricKey: string,
    public readonly dimension: string,
    public readonly period: string,
    public readonly value: number,
  ) {}
}

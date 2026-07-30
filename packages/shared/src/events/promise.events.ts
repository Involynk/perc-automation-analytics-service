export class PromiseScheduledEvent {
  constructor(
    public readonly leadId: string,
    public readonly promiseType: string,
    public readonly scheduledAt: string,
    public readonly payload: Record<string, unknown>,
  ) {}
}

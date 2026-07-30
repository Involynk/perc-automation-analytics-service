export class MessageSentEvent {
  constructor(
    public readonly leadId: string,
    public readonly channel: string,
    public readonly content: string,
    public readonly conversationId: string,
  ) {}
}

export class TimelineEventCreated {
  constructor(
    public readonly leadId: string,
    public readonly eventTypeId: string,
    public readonly description: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

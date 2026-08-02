export interface MeetingSlot {
  start: string;
  end: string;
  label: string;
}

export class MeetingRequestedEvent {
  constructor(
    public readonly leadId: string,
    public readonly source: string,
    public readonly meetingType: string,
    public readonly rawUserMessage?: string,
  ) {}
}

export class MeetingScheduledEvent {
  constructor(
    public readonly meetingId: string,
    public readonly leadId: string,
    public readonly scheduledAt: string,
    public readonly meetingType: string,
    public readonly organizerId?: string,
  ) {}
}

export class MeetingCompletedEvent {
  constructor(
    public readonly meetingId: string,
    public readonly leadId: string,
  ) {}
}

export class MeetingMissedEvent {
  constructor(
    public readonly meetingId: string,
    public readonly leadId: string,
  ) {}
}

export class MeetingRescheduledEvent {
  constructor(
    public readonly meetingId: string,
    public readonly leadId: string,
    public readonly newScheduledAt: string,
  ) {}
}

export class MeetingCancelledEvent {
  constructor(
    public readonly meetingId: string,
    public readonly leadId: string,
  ) {}
}

export class MeetingFeedbackRequestedEvent {
  constructor(
    public readonly meetingId: string,
    public readonly leadId: string,
  ) {}
}

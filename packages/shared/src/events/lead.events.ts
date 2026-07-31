export class LeadCapturedEvent {
  constructor(
    public readonly leadId: string,
    public readonly source: string,
    public readonly firstName: string,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly categories: string[],
    public readonly message: string | undefined,
    public readonly metadata: Record<string, unknown> | undefined,
    public readonly triggerEvent?: string,
    public readonly courseId?: string,
    public readonly branchId?: string,
    public readonly counselorId?: string,
    public readonly confidence?: number,
  ) {}
}

export class LeadRoutedToWhatsAppEvent {
  constructor(
    public readonly leadId: string,
    public readonly phone: string,
    public readonly message: string,
    public readonly categories: string[],
  ) {}
}

export class LeadAskedForWhatsAppEvent {
  constructor(
    public readonly leadId: string,
    public readonly channel: string,
    public readonly message: string,
    public readonly categories: string[],
  ) {}
}

export class PhoneExtractedEvent {
  constructor(
    public readonly leadId: string,
    public readonly phone: string,
  ) {}
}

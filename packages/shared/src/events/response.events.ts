export interface ResponseTarget {
  entity_type: string;
  entity_id: string;
  destination: Record<string, string>;
  preferred_channel: string;
  language_preference?: string;
}

export interface ResponseContext {
  lead_name: string;
  raw_user_message?: string;
  course_id?: string;
  branch_id?: string;
  counselor_id?: string;
  scholarship_id?: string;
  campaign_id?: string;
  nlp_confidence_score?: number;
}

export class ResponseEvent {
  constructor(
    public readonly event_id: string,
    public readonly trigger_event: string,
    public readonly trigger_source: string,
    public readonly source_channel: string,
    public readonly target: ResponseTarget,
    public readonly context: ResponseContext,
  ) {}
}

export interface LeadCreateDto {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  source: string;
  source_reference_id?: string;
  category?: string;
  categories?: string[];
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageInboundDto {
  lead_id: string;
  channel: string;
  content: string;
  content_type?: string;
  channel_message_id?: string;
  metadata?: Record<string, unknown>;
}

export interface PhoneExtractResult {
  phone: string | null;
  normalized: string | null;
}

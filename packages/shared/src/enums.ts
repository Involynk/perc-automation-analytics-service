export enum LeadStatus {
  NEW = 'new',
  INFORMATION_SHARED = 'information_shared',
  WAITING = 'waiting',
  INTERESTED = 'interested',
  CALL_SCHEDULED = 'call_scheduled',
  MEETING_COMPLETED = 'meeting_completed',
  DEMO_SCHEDULED = 'demo_scheduled',
  ADMISSION_PENDING = 'admission_pending',
  ADMITTED = 'admitted',
  INACTIVE = 'inactive',
  RECOVERY = 'recovery',
  LOST = 'lost',
  CLOSED = 'closed',
}

export enum LeadClassification {
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
  RETURNING = 'returning',
  REFERRAL = 'referral',
  HIGH_PRIORITY = 'high_priority',
  SCHOLARSHIP_CANDIDATE = 'scholarship_candidate',
  VIP = 'vip',
}

export enum ChannelName {
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  EMAIL = 'email',
  WEBSITE_FORM = 'website_form',
  WEBSITE_CHAT = 'website_chat',
  GOOGLE_BUSINESS = 'google_business',
  PHONE = 'phone',
  WALKIN = 'walkin',
  REFERRAL = 'referral',
  SMS = 'sms',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COUNSELOR = 'counselor',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  VIDEO = 'video',
  AUDIO = 'audio',
  LOCATION = 'location',
  STICKER = 'sticker',
  BUTTON = 'button',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum PromiseType {
  FOLLOWUP = 'followup',
  REMINDER = 'reminder',
  ESCALATION = 'escalation',
  REPORT = 'report',
  MESSAGE_DELAY = 'message_delay',
  MEETING_REMINDER = 'meeting_reminder',
  RECOVERY = 'recovery',
  FEEDBACK = 'feedback',
  NOTIFICATION = 'notification',
}

export enum PromiseStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export const TWO_WAY_CHANNELS: string[] = [
  ChannelName.INSTAGRAM,
  ChannelName.FACEBOOK,
  ChannelName.EMAIL,
  ChannelName.WEBSITE_CHAT,
];

export enum MeetingType {
  CALL = 'call',
  MEETING = 'meeting',
  DEMO = 'demo',
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

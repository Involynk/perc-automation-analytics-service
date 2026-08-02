export const TRIGGER_SOURCE_LEAD_CAPTURE = 'Lead Capture Engine';

export const DEFAULT_TRIGGER_EVENT = 'enquiry.intent.general_info';

export const HANDOVER_CONFIDENCE_THRESHOLD = 0.5;

export const TRIGGER_ENQUIRY_RECEIVED = 'enquiry.received';
export const TRIGGER_ENQUIRY_RETURNING = 'enquiry.returning';
export const TRIGGER_ENQUIRY_RECEIVED_AFTER_HOURS = 'enquiry.received.after_hours';
export const TRIGGER_ENQUIRY_ASSIGNED = 'enquiry.assigned';
export const TRIGGER_CONVERSATION_RESUMED = 'conversation.resumed';

export const TRIGGER_INTENT_GENERAL_INFO = 'enquiry.intent.general_info';
export const TRIGGER_INTENT_TIMINGS = 'enquiry.intent.timings';
export const TRIGGER_INTENT_CONTACT_DETAILS = 'enquiry.intent.contact_details';
export const TRIGGER_INTENT_ADMISSION_PROCESS = 'enquiry.intent.admission_process';

export const TRIGGER_INTENT_COURSE_LIST = 'enquiry.intent.course_list';
export const TRIGGER_INTENT_COURSE_DETAILS = 'enquiry.intent.course_details';
export const TRIGGER_INTENT_ELIGIBILITY = 'enquiry.intent.eligibility';
export const TRIGGER_INTENT_SYLLABUS = 'enquiry.intent.syllabus';

export const TRIGGER_INTENT_FEE_STRUCTURE = 'enquiry.intent.fee_structure';
export const TRIGGER_INTENT_SCHOLARSHIP = 'enquiry.intent.scholarship';
export const TRIGGER_INTENT_REFUND_POLICY = 'enquiry.intent.refund_policy';

export const TRIGGER_INTENT_BRANCH_LIST = 'enquiry.intent.branch_list';
export const TRIGGER_INTENT_BRANCH_LOCATION = 'enquiry.intent.branch_location';
export const TRIGGER_INTENT_HOSTEL_FACILITY = 'enquiry.intent.hostel_facility';

export const TRIGGER_HANDOVER_REQUESTED = 'handover.requested';
export const TRIGGER_HANDOVER_CONFIDENCE_LOW = 'handover.confidence_low';
export const TRIGGER_HANDOVER_COMPLAINT = 'handover.complaint';

export const TRIGGER_MEETING_REQUESTED = 'meeting.requested';
export const TRIGGER_MEETING_CONFIRMED = 'meeting.confirmed';
export const TRIGGER_MEETING_REMINDER = 'meeting.reminder';
export const TRIGGER_MEETING_MISSED = 'meeting.missed';
export const TRIGGER_MEETING_RESCHEDULED = 'meeting.rescheduled';
export const TRIGGER_MEETING_CANCELLED = 'meeting.cancelled';
export const TRIGGER_MEETING_COMPLETED = 'meeting.completed';
export const TRIGGER_MEETING_FEEDBACK_REQUEST = 'meeting.feedback_request';

export const MEETING_TRIGGERS = [
  TRIGGER_MEETING_REQUESTED,
  TRIGGER_MEETING_CONFIRMED,
  TRIGGER_MEETING_REMINDER,
  TRIGGER_MEETING_MISSED,
  TRIGGER_MEETING_RESCHEDULED,
  TRIGGER_MEETING_CANCELLED,
  TRIGGER_MEETING_COMPLETED,
  TRIGGER_MEETING_FEEDBACK_REQUEST,
];

export function isMeetingTrigger(triggerEvent: string): boolean {
  return MEETING_TRIGGERS.includes(triggerEvent);
}

export const TRIGGER_KEYWORDS: Record<string, string[]> = {
  [TRIGGER_INTENT_REFUND_POLICY]: ['refund', 'cancellation', 'money back'],
  [TRIGGER_INTENT_SCHOLARSHIP]: ['scholarship', 'discount', 'financial aid', 'concession', 'stipend'],
  [TRIGGER_INTENT_FEE_STRUCTURE]: ['fee', 'fees', 'fee structure', 'cost', 'price', 'payment', 'installment', 'tuition'],
  [TRIGGER_INTENT_ELIGIBILITY]: ['eligible', 'eligibility', 'qualify', 'can i join', 'can i get admission', 'am i eligible'],
  [TRIGGER_INTENT_SYLLABUS]: ['syllabus', 'curriculum', 'brochure', 'study material'],
  [TRIGGER_INTENT_COURSE_LIST]: ['what courses', 'which courses', 'courses offered', 'programs offered', 'what programs', 'list of courses'],
  [TRIGGER_INTENT_COURSE_DETAILS]: ['course', 'courses', 'program', 'subject', 'batch', 'class', 'study', 'about b.tech', 'about mba'],
  [TRIGGER_INTENT_BRANCH_LIST]: ['which branches', 'centers located', 'locations do you have', 'where are your centers'],
  [TRIGGER_INTENT_BRANCH_LOCATION]: ['branch', 'location', 'address', 'near me', 'map', 'center', 'centre', 'directions', 'where are you'],
  [TRIGGER_INTENT_HOSTEL_FACILITY]: ['hostel', 'accommodation', 'pg', 'dormitory', 'lodging', 'stay'],
  [TRIGGER_INTENT_ADMISSION_PROCESS]: ['admission process', 'how do i apply', 'how to apply', 'apply for admission', 'enroll', 'register'],
  [TRIGGER_INTENT_TIMINGS]: ['timing', 'timings', 'open', 'office hours', 'batch time', 'class time', 'schedule'],
  [TRIGGER_INTENT_CONTACT_DETAILS]: ['phone number', 'contact number', 'email address', 'contact details', 'reach you', 'call'],
  [TRIGGER_INTENT_GENERAL_INFO]: ['about perc', 'about your college', 'tell me about', 'about the college', 'introduce', 'information', 'what is perc', 'details about'],
  [TRIGGER_MEETING_REQUESTED]: ['book a call', 'book a meeting', 'schedule a call', 'schedule a meeting', 'schedule a demo', 'book a demo', 'want to talk', 'need to talk', 'talk to someone', 'talk to a counselor', 'speak to someone', 'appointment', 'meeting', 'demo', 'consultation', 'talk to a human'],
};

export const ORDERED_TRIGGER_EVENTS = [
  TRIGGER_MEETING_REQUESTED,
  TRIGGER_INTENT_REFUND_POLICY,
  TRIGGER_INTENT_SCHOLARSHIP,
  TRIGGER_INTENT_FEE_STRUCTURE,
  TRIGGER_INTENT_ELIGIBILITY,
  TRIGGER_INTENT_SYLLABUS,
  TRIGGER_INTENT_COURSE_LIST,
  TRIGGER_INTENT_COURSE_DETAILS,
  TRIGGER_INTENT_BRANCH_LIST,
  TRIGGER_INTENT_BRANCH_LOCATION,
  TRIGGER_INTENT_HOSTEL_FACILITY,
  TRIGGER_INTENT_ADMISSION_PROCESS,
  TRIGGER_INTENT_TIMINGS,
  TRIGGER_INTENT_CONTACT_DETAILS,
  TRIGGER_INTENT_GENERAL_INFO,
];

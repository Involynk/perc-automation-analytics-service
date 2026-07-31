import {
  TRIGGER_ENQUIRY_RECEIVED,
  TRIGGER_INTENT_GENERAL_INFO,
  TRIGGER_INTENT_TIMINGS,
  TRIGGER_INTENT_CONTACT_DETAILS,
  TRIGGER_INTENT_ADMISSION_PROCESS,
  TRIGGER_INTENT_COURSE_LIST,
  TRIGGER_INTENT_COURSE_DETAILS,
  TRIGGER_INTENT_ELIGIBILITY,
  TRIGGER_INTENT_SYLLABUS,
  TRIGGER_INTENT_FEE_STRUCTURE,
  TRIGGER_INTENT_SCHOLARSHIP,
  TRIGGER_INTENT_REFUND_POLICY,
  TRIGGER_INTENT_BRANCH_LIST,
  TRIGGER_INTENT_BRANCH_LOCATION,
  TRIGGER_INTENT_HOSTEL_FACILITY,
  TRIGGER_HANDOVER_REQUESTED,
  TRIGGER_HANDOVER_COMPLAINT,
} from '@perc/shared';

export const TEMPLATES: Record<string, string> = {
  [TRIGGER_ENQUIRY_RECEIVED]: 'Hi {{lead_name}}, thanks for reaching out to PERC! Could you please share your WhatsApp number so we can send you all the details?',
  [TRIGGER_INTENT_GENERAL_INFO]: 'Hi {{lead_name}}, thanks for your interest in PERC! Our team will share detailed information with you shortly. For anything urgent, you can reach us at +91 80 4567 8900.',
  [TRIGGER_INTENT_TIMINGS]: 'Hi {{lead_name}}, our office hours are 9 AM to 6 PM, Monday to Saturday. You can also message us anytime and we will get back to you.',
  [TRIGGER_INTENT_CONTACT_DETAILS]: 'Hi {{lead_name}}, you can reach us at +91 80 4567 8900 or email admissions@perc.edu. Our team will be happy to help!',
  [TRIGGER_INTENT_ADMISSION_PROCESS]: 'Hi {{lead_name}}, the admission process is simple: 1) Share your details, 2) Submit the required documents, 3) Pay the admission fee. Our team will guide you through each step.',
  [TRIGGER_INTENT_COURSE_LIST]: 'Hi {{lead_name}}, we offer the following programs: {{course_list}}. Which one are you interested in?',
  [TRIGGER_INTENT_COURSE_DETAILS]: 'Hi {{lead_name}}, here are the details for {{course_name}}: Duration - {{course_duration}}; Eligibility - {{course_eligibility}}. Brochure: {{syllabus_link}}',
  [TRIGGER_INTENT_ELIGIBILITY]: 'Hi {{lead_name}}, the eligibility for {{course_name}} is: {{course_eligibility}}. Would you like to know more about the admission process?',
  [TRIGGER_INTENT_SYLLABUS]: 'Hi {{lead_name}}, here is the syllabus/brochure for {{course_name}}: {{syllabus_link}}',
  [TRIGGER_INTENT_FEE_STRUCTURE]: 'Hi {{lead_name}}, the fee for {{course_name}} is {{fee_amount}}. Download the syllabus here: {{syllabus_link}}',
  [TRIGGER_INTENT_SCHOLARSHIP]: 'Hi {{lead_name}}, we offer scholarships and discounts for eligible students. Our team will share the scholarship criteria with you soon.',
  [TRIGGER_INTENT_REFUND_POLICY]: 'Hi {{lead_name}}, our refund policy allows cancellations within the first week of admission. Our team will share the full policy details with you.',
  [TRIGGER_INTENT_BRANCH_LIST]: 'Hi {{lead_name}}, we have centers at the following locations: {{branch_list}}. Which one is closest to you?',
  [TRIGGER_INTENT_BRANCH_LOCATION]: 'Hi {{lead_name}}, {{branch_name}} is located at {{branch_address}}. Map link: {{map_link}} | Contact: {{branch_contact_number}}',
  [TRIGGER_INTENT_HOSTEL_FACILITY]: 'Hi {{lead_name}}, we offer hostel accommodation near {{branch_name}}. Our team will share the hostel details with you.',
  [TRIGGER_HANDOVER_REQUESTED]: 'Hi {{lead_name}}, I am connecting you with our team right away. {{counselor_text}}They will reach out to you within 15 minutes.',
  [TRIGGER_HANDOVER_COMPLAINT]: 'Hi {{lead_name}}, we are sorry to hear that. Our team will look into this immediately and get back to you.',
};

export function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

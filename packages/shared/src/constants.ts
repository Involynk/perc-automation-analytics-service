export const WAIT_FIRST_HOURS = 2;
export const WAIT_SECOND_HOURS = 24;
export const ESCALATION_HOURS = 48;
export const MAX_RETRIES = 2;

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fee_enquiry: ['fee', 'fees', 'payment', 'cost', 'price', 'installment', 'scholarship', 'discount'],
  course_enquiry: ['course', 'program', 'subject', 'batch', 'curriculum', 'syllabus', 'class', 'study'],
  admission_enquiry: ['admission', 'enroll', 'register', 'apply', 'form', 'enrolment'],
  branch_enquiry: ['branch', 'location', 'address', 'near', 'map', 'place', 'center'],
  faculty_enquiry: ['faculty', 'teacher', 'instructor', 'professor', 'staff', 'mentor'],
  hostel_enquiry: ['hostel', 'accommodation', 'pg', 'dormitory', 'lodging'],
};

export const ORDERED_CATEGORIES = [
  'fee_enquiry',
  'course_enquiry',
  'admission_enquiry',
  'branch_enquiry',
  'faculty_enquiry',
  'hostel_enquiry',
];

export const CATEGORY_MESSAGES: Record<string, string> = {
  fee_enquiry: 'our fee structure',
  course_enquiry: 'our courses',
  admission_enquiry: 'admissions',
  branch_enquiry: 'our locations',
  faculty_enquiry: 'our faculty',
  hostel_enquiry: 'our hostel facilities',
  general_enquiry: '',
};

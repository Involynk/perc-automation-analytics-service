export interface Course {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  eligibility?: string;
  subjects?: string;
  curriculum?: string;
  learning_outcomes?: string;
  batch_timings?: string;
  faculty?: string;
  brochure_url?: string;
  pdf_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface LeadCourse {
  lead_id: string;
  course_id: string;
  interest_level?: string;
  notes?: string;
  created_at: string;
}

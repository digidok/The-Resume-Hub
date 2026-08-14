export type ProfileRole = "candidate" | "employer" | "admin";
export type ProfilePlan = "free" | "pro";

export type SubscriptionPlan = "candidate_pro" | "employer_jobs";

export type InvoiceRequestStatus = "requested" | "invoiced" | "paid" | "cancelled";

export type InvoiceRequest = {
  id: string;
  employer_id: string;
  package_id: string;
  amount_zar: number;
  company_name: string;
  contact_person: string;
  billing_email: string;
  vat_number: string | null;
  billing_address: string | null;
  notes: string | null;
  status: InvoiceRequestStatus;
  invoice_number: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  role: ProfileRole;
  title: string | null;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  plan: ProfilePlan;
  credits_remaining: number;
  open_to_work: boolean;
  subscription_plan: SubscriptionPlan | null;
  subscription_expires_at: string | null;
  job_posting_credits: number;
  phone_number: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type ResumeExperience = {
  id: string;
  company: string;
  title: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  description?: string;
};

export type ResumeEducation = {
  id: string;
  school: string;
  degree?: string;
  field?: string;
  start_date?: string;
  end_date?: string;
};

export type ResumeProject = {
  id: string;
  name: string;
  description?: string;
  url?: string;
};

export type ResumeContent = {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  summary?: string;
  photo_url?: string;
  nationality?: string;
  visa_status?: string;
  date_of_birth?: string;
  marital_status?: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  languages: string[];
  projects: ResumeProject[];
  certifications: string[];
  awards: string[];
};

export type Resume = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  template: string;
  content: ResumeContent;
  is_public: boolean;
  source_file_path: string | null;
  created_at: string;
  updated_at: string;
};

export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type JobStatus = "open" | "closed";

export type Job = {
  id: string;
  employer_id: string | null;
  title: string;
  company: string;
  location: string | null;
  province: string | null;
  country: string;
  employment_type: EmploymentType;
  description: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  industry: string | null;
  experience_min: number | null;
  experience_max: number | null;
  qualification_requirements: string | null;
  skills: string[];
  application_url: string | null;
  source: string | null;
  serpapi_job_id: string | null;
  hiring_manager_name: string | null;
  hiring_manager_title: string | null;
  hiring_manager_email: string | null;
  status: JobStatus;
  posted_at: string;
  closing_date: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyRating = {
  id: string;
  company: string;
  country: string;
  rating: number | null;
  reviews_count: number | null;
  fetched_at: string;
};

export type JobMatch = {
  jobId: string;
  overallScore: number;
  experienceScore: number;
  skillsScore: number;
  qualificationScore: number;
  industryScore: number;
  locationScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
};

export type ApplicationStatus = "submitted" | "interviewing" | "offer" | "hired" | "rejected";

export type VerificationStatus = "not_requested" | "requested" | "in_progress" | "passed" | "failed";

export type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  resume_id: string;
  cover_note: string | null;
  status: ApplicationStatus;
  interview_scheduled_at: string | null;
  shortlisted: boolean;
  created_at: string;
  updated_at: string;
  cover_letter_id: string | null;
  verification_status: VerificationStatus;
  verification_requested_at: string | null;
};

export type AiGeneration = {
  id: string;
  user_id: string;
  job_id: string;
  source_resume_id: string;
  tailored_resume_id: string;
  cover_letter_id: string;
  matched_skills: string[];
  skills_to_address: string[];
  profile_match_pct: number | null;
  application_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewChecklist = {
  id: string;
  ai_generation_id: string;
  resume_reviewed: boolean;
  cover_letter_reviewed: boolean;
  contact_confirmed: boolean;
  work_auth_confirmed: boolean;
  salary_confirmed: boolean;
  questions_done: boolean;
  updated_at: string;
};

export type ScorecardRecommendation = "strong_yes" | "yes" | "no" | "strong_no";

export type InterviewScorecard = {
  id: string;
  application_id: string;
  employer_id: string;
  ratings: Record<string, number>;
  notes: string | null;
  recommendation: ScorecardRecommendation | null;
  created_at: string;
  updated_at: string;
};

export type OfferLetterStatus = "draft" | "sent" | "accepted" | "declined";

export type OfferLetter = {
  id: string;
  application_id: string;
  employer_id: string;
  content: string;
  status: OfferLetterStatus;
  created_at: string;
  updated_at: string;
};

export type InductionModule = {
  id: string;
  employer_id: string;
  title: string;
  content: string;
  pass_threshold: number;
  created_at: string;
  updated_at: string;
};

export type InductionQuestion = {
  id: string;
  module_id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  position: number;
  created_at: string;
};

export type InductionQuestionPublic = {
  id: string;
  question: string;
  options: string[];
};

export type InterviewNoteFile = {
  id: string;
  application_id: string;
  employer_id: string;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
};

export type InductionAttempt = {
  id: string;
  module_id: string;
  application_id: string;
  candidate_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, number>;
  completed_at: string;
};

export type CoverLetter = {
  id: string;
  user_id: string;
  job_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type SavedJob = {
  id: string;
  user_id: string;
  job_id: string | null;
  external_title: string | null;
  external_company: string | null;
  external_location: string | null;
  external_url: string | null;
  created_at: string;
};

export type FollowUp = {
  id: string;
  application_id: string;
  user_id: string;
  due_date: string;
  note: string | null;
  completed: boolean;
  draft_subject: string | null;
  draft_body: string | null;
  sent: boolean;
  created_at: string;
};

export type AutoApplySettings = {
  user_id: string;
  resume_id: string;
  keywords: string;
  location: string | null;
  enabled: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

export type ConnectionStatus = "pending" | "accepted";

export type Connection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};

export type ResumeScoreCategories = {
  ats_compatibility: number;
  keyword_coverage: number;
  summary_quality: number;
  experience_quality: number;
  achievement_quality: number;
  skills_score: number;
  formatting_score: number;
  completeness_score: number;
};

export type AiReview = {
  id: string;
  resume_id: string;
  job_description: string | null;
  score: number | null;
  feedback: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
    keyword_gaps?: string[];
    categories?: ResumeScoreCategories;
  };
  created_at: string;
};

export type CareerProfile = {
  id: string;
  user_id: string;
  professional_title: string | null;
  years_experience: number | null;
  career_level: string | null;
  industry: string | null;
  target_roles: string[];
  preferred_locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  employment_type: string | null;
  work_preference: string | null;
  skills: string[];
  qualifications: string[];
  certifications: string[];
  languages: string[];
  linkedin_url: string | null;
  portfolio_url: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  has_drivers_license: boolean;
  drivers_license_code: string | null;
  has_criminal_record: boolean | null;
  criminal_record_details: string | null;
  has_been_arrested: boolean | null;
  arrest_details: string | null;
  background_consent_given: boolean;
  background_consent_signed_name: string | null;
  background_consent_signed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CareerDocumentType = "id_copy" | "drivers_license" | "certificate" | "payslip" | "other";

export type CareerDocument = {
  id: string;
  user_id: string;
  document_type: CareerDocumentType;
  storage_path: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
};

export type ReferenceRequestStatus = "not_requested" | "requested" | "received";

export type CareerReference = {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  request_status: ReferenceRequestStatus;
  request_token: string;
  requested_at: string | null;
  reference_text: string | null;
  received_at: string | null;
  created_at: string;
};

export type RecruiterMessageChannel = "linkedin" | "email" | "whatsapp";

export type RecruiterMessage = {
  id: string;
  user_id: string;
  job_id: string | null;
  channel: RecruiterMessageChannel;
  content: string;
  created_at: string;
};

export type BlogPost = {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const emptyResumeContent = (): ResumeContent => ({
  full_name: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  certifications: [],
  awards: [],
});

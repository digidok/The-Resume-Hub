export type ProfileRole = "candidate" | "employer" | "admin";
export type ProfilePlan = "free" | "pro";

export type SubscriptionPlan = "candidate_pro" | "employer_jobs";

export type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  plan: ProfilePlan;
  credits_remaining: number;
  open_to_work: boolean;
  subscription_plan: SubscriptionPlan | null;
  subscription_expires_at: string | null;
  job_posting_credits: number;
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
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  languages: string[];
  projects: ResumeProject[];
};

export type Resume = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  template: string;
  content: ResumeContent;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type JobStatus = "open" | "closed";

export type Job = {
  id: string;
  employer_id: string;
  title: string;
  company: string;
  location: string | null;
  employment_type: EmploymentType;
  description: string;
  salary_min: number | null;
  salary_max: number | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
};

export type ApplicationStatus = "submitted" | "interviewing" | "offer" | "rejected";

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

export type OfferLetterStatus = "draft" | "sent";

export type OfferLetter = {
  id: string;
  application_id: string;
  employer_id: string;
  content: string;
  status: OfferLetterStatus;
  created_at: string;
  updated_at: string;
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
  job_id: string;
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
  };
  created_at: string;
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
});

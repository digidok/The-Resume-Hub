export type ProfileRole = "candidate" | "employer";

export type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
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

export type ApplicationStatus = "submitted" | "reviewed" | "rejected" | "accepted";

export type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  resume_id: string;
  cover_note: string | null;
  status: ApplicationStatus;
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
  projects: [],
});

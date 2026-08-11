export type CvFileKind = "pdf" | "docx" | "doc" | "image";

export type ExtractionMode = "text" | "pdf-document" | "image";

export type CvExperienceExtract = {
  company?: string;
  title?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  description?: string;
};

export type CvEducationExtract = {
  school?: string;
  degree?: string;
  field?: string;
  start_date?: string;
  end_date?: string;
};

export type CvProjectExtract = {
  name?: string;
  description?: string;
  url?: string;
};

export type CvConfidenceScores = {
  contact_info: number;
  work_experience: number;
  education: number;
  skills: number;
};

/** Raw shape returned by Claude's structured extraction call. */
export type CvExtractionResult = {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  summary?: string;
  experience: CvExperienceExtract[];
  education: CvEducationExtract[];
  skills: string[];
  languages: string[];
  projects: CvProjectExtract[];
  certifications: string[];
};

export type CvSourceFile = {
  storagePath: string;
  fileName: string;
  fileSize: number;
};

/** Sent to the client after parsing — nothing is written to the resumes table yet. */
export type CvImportDraft = {
  content: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
    experience: Array<{
      id: string;
      company: string;
      title: string;
      location?: string;
      start_date?: string;
      end_date?: string;
      current?: boolean;
      description?: string;
    }>;
    education: Array<{
      id: string;
      school: string;
      degree?: string;
      field?: string;
      start_date?: string;
      end_date?: string;
    }>;
    skills: string[];
    languages: string[];
    projects: Array<{ id: string; name: string; description?: string; url?: string }>;
  };
  careerExtras: {
    professionalTitle: string;
    certifications: string[];
    linkedinUrl: string;
  };
  /** Computed deterministically from completeness + our own validation — not self-reported by the model. */
  confidence: CvConfidenceScores;
  lowConfidenceFields: string[];
  hasProfilePhoto: boolean;
  sourceFiles: CvSourceFile[];
  warning?: string;
};

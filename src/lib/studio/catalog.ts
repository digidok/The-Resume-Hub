// Shared by the Document Studio form (browser) and /api/studio-request (server).

export type DocumentOption = { id: string; label: string; description: string };
export type DocumentGroup = { id: string; label: string; options: DocumentOption[] };

export const DOCUMENT_GROUPS: DocumentGroup[] = [
  {
    id: "plans",
    label: "Business plans & proposals",
    options: [
      { id: "business-plan", label: "Business plan", description: "Investor- or bank-ready plan with financial narrative." },
      { id: "company-profile", label: "Company profile", description: "Branded profile for clients, tenders and partners." },
      { id: "proposal", label: "Proposal or tender document", description: "Structured response to an RFP, RFQ or tender." },
    ],
  },
  {
    id: "board",
    label: "Board packs & minutes",
    options: [
      { id: "board-pack", label: "Board pack", description: "Compiled, paginated pack with agenda and papers." },
      { id: "minutes", label: "Minutes & resolutions", description: "Formal minutes, resolutions and action registers." },
      { id: "transcription", label: "Meeting transcription", description: "Upload a recording; we return a transcript or minutes." },
    ],
  },
  {
    id: "governance",
    label: "Policies & SOPs",
    options: [
      { id: "policy", label: "Governance policy", description: "Policies formatted and aligned to your structure." },
      { id: "sop", label: "Standard operating procedure", description: "Clear, repeatable procedures for your teams." },
      { id: "register", label: "Governance register", description: "Director, interests and resolution registers." },
    ],
  },
  {
    id: "branded",
    label: "Presentations & branded templates",
    options: [
      { id: "presentation", label: "Executive presentation", description: "Board or investor deck in your brand." },
      { id: "letterhead", label: "Letterhead & document templates", description: "Reusable branded Word templates for your business." },
    ],
  },
];

export const DOCUMENT_TYPE_IDS = DOCUMENT_GROUPS.flatMap((g) => g.options.map((o) => o.id));

export function documentLabel(id: string): string {
  for (const g of DOCUMENT_GROUPS) {
    const found = g.options.find((o) => o.id === id);
    if (found) return found.label;
  }
  return id;
}

export type TemplateStyle = {
  id: string;
  label: string;
  note: string;
  primary: string;
  accent: string;
  paper: string;
  serif: boolean;
};

export const TEMPLATE_STYLES: TemplateStyle[] = [
  { id: "executive-navy", label: "Executive Navy", note: "Formal, navy and gold. Boards and corporates.", primary: "#182e54", accent: "#b8933f", paper: "#ffffff", serif: false },
  { id: "classic-serif", label: "Classic Serif", note: "Traditional serif headings. Legal and governance.", primary: "#2b2b2b", accent: "#8e6f29", paper: "#fbf9f4", serif: true },
  { id: "modern-slate", label: "Modern Slate", note: "Clean and contemporary. Growth businesses.", primary: "#334155", accent: "#0f766e", paper: "#ffffff", serif: false },
  { id: "minimal-mono", label: "Minimal", note: "Understated black and white. Maximum clarity.", primary: "#0f172a", accent: "#64748b", paper: "#ffffff", serif: false },
];

export const TEMPLATE_STYLE_IDS = TEMPLATE_STYLES.map((t) => t.id);

export type UploadKind = "logo" | "recording" | "supporting";

export const UPLOAD_RULES: Record<
  UploadKind,
  { label: string; maxBytes: number; maxFiles: number; mimes: string[]; accept: string }
> = {
  logo: {
    label: "Logo",
    maxBytes: 5 * 1024 * 1024,
    maxFiles: 1,
    mimes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
    accept: "image/png,image/jpeg,image/svg+xml,image/webp",
  },
  recording: {
    label: "Recording",
    maxBytes: 50 * 1024 * 1024,
    maxFiles: 1,
    mimes: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/webm", "audio/ogg", "video/mp4", "video/webm"],
    accept: "audio/*,video/mp4,video/webm,.m4a,.mp3,.wav",
  },
  supporting: {
    label: "Supporting document",
    maxBytes: 20 * 1024 * 1024,
    maxFiles: 3,
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.pptx,.txt",
  },
};

export type FileDescriptor = { kind: UploadKind; name: string; size: number; type: string };

export type StudioSubmission = {
  documentType: string;
  templateStyle: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  deadline?: string;
  brief?: string;
  files: FileDescriptor[];
  website?: string; // honeypot, must stay empty
};

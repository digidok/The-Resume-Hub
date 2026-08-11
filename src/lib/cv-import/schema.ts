export const CV_EXTRACTION_SCHEMA = {
  type: "object" as const,
  properties: {
    full_name: { type: "string" as const },
    email: { type: "string" as const },
    phone: { type: "string" as const },
    location: { type: "string" as const },
    website: { type: "string" as const },
    summary: { type: "string" as const },
    experience: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          company: { type: "string" as const },
          title: { type: "string" as const },
          location: { type: "string" as const },
          start_date: { type: "string" as const },
          end_date: { type: "string" as const },
          current: { type: "boolean" as const },
          description: { type: "string" as const },
        },
        required: ["company", "title"],
        additionalProperties: false,
      },
    },
    education: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          school: { type: "string" as const },
          degree: { type: "string" as const },
          field: { type: "string" as const },
          start_date: { type: "string" as const },
          end_date: { type: "string" as const },
        },
        required: ["school"],
        additionalProperties: false,
      },
    },
    skills: { type: "array" as const, items: { type: "string" as const } },
    languages: { type: "array" as const, items: { type: "string" as const } },
    projects: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const },
          description: { type: "string" as const },
          url: { type: "string" as const },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
    certifications: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["full_name", "experience", "education", "skills", "languages", "projects", "certifications"],
  additionalProperties: false,
};

/** Deliberately tiny/separate schema — combining this with CV_EXTRACTION_SCHEMA
 * above pushes structured-output schema compilation past its complexity limit. */
export const PHOTO_DETECTION_SCHEMA = {
  type: "object" as const,
  properties: {
    has_profile_photo: { type: "boolean" as const },
  },
  required: ["has_profile_photo"],
  additionalProperties: false,
};

const BASE_INSTRUCTIONS = `You are extracting structured resume/CV data. Only use information that is actually present in the document — never invent names, dates, employers, or qualifications. If a field is unclear or missing, leave it blank (or omit it from the array) rather than guessing. If a page or section repeats information already captured (e.g. a summary that restates work history), do not duplicate it.

For work experience, keep each employer as a SEPARATE entry — never merge two different jobs into one record. Do not invent start/end dates; leave a date blank if it is illegible or ambiguous rather than guessing. Write each role's responsibilities and achievements as bullet points inside "description", one per line prefixed with "• ".

Extract skills that are both explicitly listed AND clearly demonstrated in the work experience text — but do not manufacture skills that aren't supported by the document.

website: the candidate's LinkedIn profile URL if present, otherwise a personal website/portfolio URL, otherwise leave blank.`;

export function buildTextExtractionPrompt(sourceText: string): string {
  return `${BASE_INSTRUCTIONS}\n\nDocument text (may span multiple pages, separated by "--- page N ---"):\n\n${sourceText}`;
}

export function buildDocumentExtractionPrompt(): string {
  return `${BASE_INSTRUCTIONS}\n\nThe document is attached below as a PDF. It may be a scanned or photographed CV — read it visually, including any tables, columns, sidebars, or text boxes. Process every page.`;
}

export function buildImageExtractionPrompt(pageCount: number): string {
  const pageNote =
    pageCount > 1
      ? `The ${pageCount} attached images are pages of the SAME CV, in order — combine information across all of them and avoid duplicating anything that appears on more than one page.`
      : "The attached image is a photo or scan of a CV — read it visually, including any tables, columns, sidebars, or text boxes.";
  return `${BASE_INSTRUCTIONS}\n\n${pageNote}`;
}

export const PHOTO_DETECTION_PROMPT =
  "Look at this document. Does it visibly contain a headshot or profile photograph of the candidate (a picture of a person), as opposed to just text? Answer only has_profile_photo.";

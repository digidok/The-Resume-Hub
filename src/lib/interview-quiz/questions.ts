export type QuizOption = { value: string; label: string };
export type QuizQuestion = { id: string; question: string; options: QuizOption[] };

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "urgency",
    question: "When is your interview — or when are you hoping to land one?",
    options: [
      { value: "has_interview", label: "Already have an interview scheduled" },
      { value: "applying", label: "Actively applying, no interview yet" },
      { value: "starting", label: "Just started job hunting" },
      { value: "exploring", label: "Exploring a career change" },
    ],
  },
  {
    id: "industry",
    question: "What field are you interviewing in?",
    options: [
      { value: "mining_engineering", label: "Mining & Engineering" },
      { value: "corporate_finance", label: "Corporate / Finance / Admin" },
      { value: "hr_recruitment", label: "HR / Recruitment / Operations" },
      { value: "trades", label: "Trades / Technical / Artisan" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "pain_point",
    question: "What worries you most about interviews?",
    options: [
      { value: "freeze_up", label: "I freeze up and forget what to say" },
      { value: "tricky_questions", label: "I don't know how to answer tricky questions (weaknesses, gaps, salary)" },
      { value: "rambling", label: "I ramble and lose the interviewer's attention" },
      { value: "no_offers", label: "I've had interviews but never get the offer" },
    ],
  },
  {
    id: "experience_level",
    question: "How would you describe your interview experience?",
    options: [
      { value: "first_in_years", label: "First interview in years" },
      { value: "often_no_offer", label: "I interview often but rarely get offers" },
      { value: "confident_edge", label: "Fairly confident, just want an edge" },
      { value: "first_job", label: "Complete beginner (first job ever)" },
    ],
  },
  {
    id: "format_pref",
    question: "How do you prefer to prepare?",
    options: [
      { value: "whatsapp_daily", label: "Quick daily tips on WhatsApp" },
      { value: "full_document", label: "One complete prep document I can study" },
      { value: "mock_practice", label: "Practice with mock questions & feedback" },
      { value: "all", label: "All of the above" },
    ],
  },
  {
    id: "timeline",
    question: "How many days until your next opportunity to apply or interview?",
    options: [
      { value: "this_week", label: "This week" },
      { value: "two_weeks", label: "Next 2 weeks" },
      { value: "this_month", label: "Within a month" },
      { value: "early_prep", label: "Just preparing early" },
    ],
  },
];

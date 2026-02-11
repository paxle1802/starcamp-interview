export type SessionStatus = 'SETUP' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Interview {
  id: string;
  interviewerId: string;
  candidateName: string;
  date: string;
  status: SessionStatus;
  sectionConfigs: SectionConfig[];
  selectedQuestions?: InterviewQuestionItem[];
  scores?: ScoreItem[];
}

export interface SectionConfig {
  id: string;
  sectionId: string;
  durationMinutes: number;
  order: number;
  section: {
    id: string;
    name: string;
    description: string;
    defaultDuration: number;
  };
}

export interface InterviewQuestionItem {
  id: string;
  questionId: string;
  order: number;
  question: {
    id: string;
    text: string;
    answer: string;
    difficulty: string;
    sectionId: string;
    section: { name: string };
  };
}

export interface ScoreItem {
  id: string;
  interviewId: string;
  questionId: string;
  score: number;
  notes: string | null;
}

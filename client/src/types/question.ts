export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Question {
  id: string;
  sectionId: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  tags: string[];
  createdBy: string;
  createdAt: string;
  section?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

export interface CreateQuestionDTO {
  sectionId: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  tags: string[];
}

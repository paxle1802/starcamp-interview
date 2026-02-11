import { Difficulty } from '../../prisma/generated/prisma/client';

export interface CreateQuestionDTO {
  sectionId: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
  tags?: string[];
}

export interface UpdateQuestionDTO {
  text?: string;
  answer?: string;
  difficulty?: Difficulty;
  tags?: string[];
}

export interface QuestionFilters {
  sectionId?: string;
  difficulty?: Difficulty;
  tags?: string[];
  page?: number;
  limit?: number;
}

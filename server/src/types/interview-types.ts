export interface CreateInterviewDTO {
  candidateName: string;
  sectionConfigs: {
    sectionId: string;
    durationMinutes: number;
  }[];
  selectedQuestions: {
    questionId: string;
    order: number;
  }[];
}

export interface UpdateInterviewDTO {
  candidateName?: string;
  sectionConfigs?: {
    sectionId: string;
    durationMinutes: number;
  }[];
  selectedQuestions?: {
    questionId: string;
    order: number;
  }[];
}

import prisma from '../utils/prisma-client';

export class ScoreService {
  static async upsertScore(data: {
    interviewId: string;
    questionId: string;
    score: number;
    notes?: string;
  }) {
    return prisma.score.upsert({
      where: {
        interviewId_questionId: {
          interviewId: data.interviewId,
          questionId: data.questionId,
        },
      },
      create: data,
      update: {
        score: data.score,
        notes: data.notes,
      },
    });
  }

  static async getScoresForInterview(interviewId: string) {
    return prisma.score.findMany({
      where: { interviewId },
      include: { question: true },
    });
  }
}

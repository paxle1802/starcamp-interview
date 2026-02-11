import prisma from '../utils/prisma-client';
import { CreateQuestionDTO, UpdateQuestionDTO, QuestionFilters } from '../types/question-types';

const DIFFICULTY_ORDER = { EASY: 1, MEDIUM: 2, HARD: 3 } as const;

export class QuestionService {
  static async listQuestions(filters: QuestionFilters) {
    const { sectionId, difficulty, tags, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (sectionId) where.sectionId = sectionId;
    if (difficulty) where.difficulty = difficulty;
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: { section: true },
        orderBy: [{ section: { order: 'asc' } }],
        skip,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);

    // Custom sort by difficulty within same section
    const sorted = questions.sort((a, b) =>
      DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
    );

    return {
      questions: sorted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getQuestionById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        section: true,
        creator: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async createQuestion(data: CreateQuestionDTO, createdBy: string) {
    return prisma.question.create({
      data: { ...data, createdBy },
      include: { section: true },
    });
  }

  static async updateQuestion(id: string, data: UpdateQuestionDTO, userId: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) throw new Error('Question not found');
    if (question.createdBy !== userId) throw new Error('Unauthorized');

    return prisma.question.update({
      where: { id },
      data,
      include: { section: true },
    });
  }

  static async deleteQuestion(id: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) throw new Error('Question not found');

    // Delete related records first (scores and interview questions referencing this question)
    await prisma.score.deleteMany({ where: { questionId: id } });
    await prisma.interviewQuestion.deleteMany({ where: { questionId: id } });

    return prisma.question.delete({ where: { id } });
  }
}

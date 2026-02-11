import prisma from '../utils/prisma-client';
import { CreateInterviewDTO, UpdateInterviewDTO } from '../types/interview-types';

export class InterviewService {
  static async createInterview(data: CreateInterviewDTO, interviewerId: string) {
    return prisma.$transaction(async (tx) => {
      const interview = await tx.interviewSession.create({
        data: {
          interviewerId,
          candidateName: data.candidateName,
          status: 'SETUP',
        },
      });

      await tx.interviewSectionConfig.createMany({
        data: data.sectionConfigs.map((sc, idx) => ({
          interviewId: interview.id,
          sectionId: sc.sectionId,
          durationMinutes: sc.durationMinutes,
          order: idx + 1,
        })),
      });

      await tx.interviewQuestion.createMany({
        data: data.selectedQuestions.map((q) => ({
          interviewId: interview.id,
          questionId: q.questionId,
          order: q.order,
        })),
      });

      return interview;
    });
  }

  static async updateInterview(id: string, data: UpdateInterviewDTO, userId: string) {
    const interview = await prisma.interviewSession.findUnique({ where: { id } });
    if (!interview) throw new Error('Interview not found');
    if (interview.interviewerId !== userId) throw new Error('Unauthorized');
    if (interview.status !== 'SETUP') throw new Error('Can only edit interviews in SETUP status');

    return prisma.$transaction(async (tx) => {
      if (data.candidateName) {
        await tx.interviewSession.update({
          where: { id },
          data: { candidateName: data.candidateName },
        });
      }

      if (data.sectionConfigs) {
        await tx.interviewSectionConfig.deleteMany({ where: { interviewId: id } });
        await tx.interviewSectionConfig.createMany({
          data: data.sectionConfigs.map((sc, idx) => ({
            interviewId: id,
            sectionId: sc.sectionId,
            durationMinutes: sc.durationMinutes,
            order: idx + 1,
          })),
        });
      }

      if (data.selectedQuestions) {
        await tx.interviewQuestion.deleteMany({ where: { interviewId: id } });
        await tx.interviewQuestion.createMany({
          data: data.selectedQuestions.map((q) => ({
            interviewId: id,
            questionId: q.questionId,
            order: q.order,
          })),
        });
      }

      return tx.interviewSession.findUnique({ where: { id } });
    });
  }

  static async getInterview(id: string, userId: string) {
    const interview = await prisma.interviewSession.findUnique({
      where: { id },
      include: {
        sectionConfigs: {
          include: { section: true },
          orderBy: { order: 'asc' },
        },
        selectedQuestions: {
          include: { question: { include: { section: true } } },
          orderBy: { order: 'asc' },
        },
        scores: true,
      },
    });

    if (!interview) throw new Error('Interview not found');
    if (interview.interviewerId !== userId) throw new Error('Unauthorized');

    return interview;
  }

  static async listInterviews(userId: string) {
    return prisma.interviewSession.findMany({
      where: { interviewerId: userId },
      include: {
        sectionConfigs: { include: { section: true }, orderBy: { order: 'asc' } },
        selectedQuestions: { include: { question: true } },
        scores: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async startInterview(id: string, userId: string) {
    const interview = await prisma.interviewSession.findUnique({ where: { id } });
    if (!interview) throw new Error('Interview not found');
    if (interview.interviewerId !== userId) throw new Error('Unauthorized');
    if (interview.status !== 'SETUP') throw new Error('Can only start interviews in SETUP status');

    return prisma.interviewSession.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  static async completeInterview(id: string, userId: string) {
    const interview = await prisma.interviewSession.findUnique({ where: { id } });
    if (!interview) throw new Error('Interview not found');
    if (interview.interviewerId !== userId) throw new Error('Unauthorized');
    if (interview.status !== 'IN_PROGRESS') throw new Error('Can only complete interviews in IN_PROGRESS status');

    return prisma.interviewSession.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  static async deleteInterview(id: string, userId: string) {
    const interview = await prisma.interviewSession.findUnique({ where: { id } });
    if (!interview) throw new Error('Interview not found');
    if (interview.interviewerId !== userId) throw new Error('Unauthorized');

    return prisma.$transaction(async (tx) => {
      await tx.score.deleteMany({ where: { interviewId: id } });
      await tx.interviewQuestion.deleteMany({ where: { interviewId: id } });
      await tx.interviewSectionConfig.deleteMany({ where: { interviewId: id } });
      await tx.interviewSession.delete({ where: { id } });
    });
  }
}

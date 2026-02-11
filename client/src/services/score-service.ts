import apiClient from './api-client';
import type { Score } from '../types/score';

export const scoreService = {
  async upsert(data: {
    interviewId: string;
    questionId: string;
    score: number;
    notes?: string;
  }) {
    const response = await apiClient.post<Score>('/scores', data);
    return response.data;
  },

  async listByInterview(interviewId: string) {
    const response = await apiClient.get<Score[]>(`/scores/interview/${interviewId}`);
    return response.data;
  },
};

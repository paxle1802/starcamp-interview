import apiClient from './api-client';
import type { Interview } from '../types/interview';

export const interviewService = {
  async create(data: {
    candidateName: string;
    sectionConfigs: { sectionId: string; durationMinutes: number }[];
    selectedQuestions: { questionId: string; order: number }[];
  }) {
    const response = await apiClient.post<Interview>('/interviews', data);
    return response.data;
  },

  async update(id: string, data: Record<string, unknown>) {
    const response = await apiClient.put<Interview>(`/interviews/${id}`, data);
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<Interview>(`/interviews/${id}`);
    return response.data;
  },

  async list() {
    const response = await apiClient.get<Interview[]>('/interviews');
    return response.data;
  },

  async start(id: string) {
    const response = await apiClient.post<Interview>(`/interviews/${id}/start`);
    return response.data;
  },

  async complete(id: string) {
    const response = await apiClient.post<Interview>(`/interviews/${id}/complete`);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/interviews/${id}`);
  },
};

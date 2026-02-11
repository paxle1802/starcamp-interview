import apiClient from './api-client';
import type { Question, CreateQuestionDTO } from '../types/question';

export const questionService = {
  async list(params?: {
    sectionId?: string;
    difficulty?: string;
    tags?: string;
    page?: number;
  }) {
    const response = await apiClient.get<{
      questions: Question[];
      total: number;
      page: number;
      totalPages: number;
    }>('/questions', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<Question>(`/questions/${id}`);
    return response.data;
  },

  async create(data: CreateQuestionDTO) {
    const response = await apiClient.post<Question>('/questions', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateQuestionDTO>) {
    const response = await apiClient.put<Question>(`/questions/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/questions/${id}`);
  },
};

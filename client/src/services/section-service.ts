import apiClient from './api-client';
import type { Section } from '../types/section';

export const sectionService = {
  async list() {
    const response = await apiClient.get<Section[]>('/sections');
    return response.data;
  },
};

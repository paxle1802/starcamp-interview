import apiClient from './api-client';
import type { User, LoginDTO, RegisterDTO } from '../types/user';

export const authService = {
  async login(data: LoginDTO): Promise<User> {
    const response = await apiClient.post<User>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterDTO): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async me(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};

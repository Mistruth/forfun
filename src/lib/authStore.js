import { apiRequest } from './apiClient';

export const authStore = {
  async getSession() {
    return apiRequest('/api/session');
  },

  async login(password) {
    return apiRequest('/api/session', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  async logout() {
    return apiRequest('/api/session', {
      method: 'DELETE',
    });
  },
};

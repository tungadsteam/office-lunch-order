import client from '../client';

export const authService = {
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    client.post('/auth/register', data),

  getMe: () => client.get('/auth/me'),
};

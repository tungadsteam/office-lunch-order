import client from '../client';

export const adminService = {
  getStats: () => client.get('/admin/stats'),

  getUsers: () => client.get('/users'),

  updateBalance: (userId: number, amount: number) =>
    client.put(`/users/${userId}/balance`, { amount }),

  getBankInfo: () => client.get('/admin/bank-info'),
};

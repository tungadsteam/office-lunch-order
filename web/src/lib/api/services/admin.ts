import client from '../client';

export const adminService = {
  getStats: () => client.get('/admin/stats'),

  getUsers: () => client.get('/admin/users'),

  updateBalance: (userId: number, amount: number) =>
    client.put(`/users/${userId}/balance`, { amount }),

  getBankInfo: () => client.get('/admin/bank-info'),

  getSettings: () => client.get('/admin/settings'),

  updateSetting: (key: string, value: string) =>
    client.put(`/admin/settings/${key}`, { value }),
};

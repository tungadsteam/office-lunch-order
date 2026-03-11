import client from '../client';

export const transactionsService = {
  getHistory: (limit = 30, offset = 0, type?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (type) params.set('type', type);
    return client.get(`/transactions/history?${params}`);
  },

  deposit: (data: { amount: number; note?: string }) =>
    client.post('/transactions/deposit', data),

  getPending: () => client.get('/transactions/pending'),

  approve: (id: number) => client.put(`/transactions/${id}/approve`),

  reject: (id: number) => client.put(`/transactions/${id}/reject`),
};

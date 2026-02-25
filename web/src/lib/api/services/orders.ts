import client from '../client';

export const ordersService = {
  getToday: () => client.get('/orders/today'),

  join: () => client.post('/orders/today/join'),

  leave: () => client.delete('/orders/today/leave'),

  submitPayment: (data: { total_bill: number; note?: string }) =>
    client.post('/orders/today/payment', data),

  getHistory: (limit = 30, offset = 0) =>
    client.get(`/orders/history?limit=${limit}&offset=${offset}`),
};

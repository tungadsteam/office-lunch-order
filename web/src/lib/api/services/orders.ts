import client from '../client';

export const ordersService = {
  getToday: () => client.get('/orders/today'),

  getTodayActual: () => client.get('/orders/today?actual=true'),

  join: () => client.post('/orders/today/join'),

  leave: () => client.delete('/orders/today/leave'),

  claimPayment: () => client.post('/orders/today/claim-payment'),

  selectBuyers: () => client.post('/orders/today/select-buyers'),

  getSessions: () => client.get('/orders/sessions'),

  selectBuyersById: (id: number) => client.post(`/orders/sessions/${id}/select-buyers`),

  submitPayment: (data: { total_bill: number; note?: string }) =>
    client.post('/orders/today/payment', data),

  getHistory: (limit = 30, offset = 0) =>
    client.get(`/orders/history?limit=${limit}&offset=${offset}`),
};

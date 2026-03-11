import client from '../client';

export const reimbursementsService = {
  getMy: () => client.get('/reimbursements/my'),
  getAll: (status?: string) =>
    client.get(`/reimbursements/all${status ? `?status=${status}` : ''}`),
  markTransferred: (id: number, notes?: string) =>
    client.post(`/reimbursements/${id}/transfer`, { notes }),
  confirm: (id: number, received: boolean, note?: string) =>
    client.post(`/reimbursements/${id}/confirm`, { received, note }),
};

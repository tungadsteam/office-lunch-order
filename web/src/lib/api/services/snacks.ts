import client from '../client';

export const snacksService = {
  getActiveMenu: () => client.get('/snacks/menus/active'),
  placeOrder: (menuId: number, items: { itemId: number; quantity: number }[]) =>
    client.post('/snacks/orders', { menuId, items }),
  getMyOrders: () => client.get('/snacks/orders/my'),
  updateOrder: (orderId: number, quantity: number) =>
    client.put(`/snacks/orders/${orderId}`, { quantity }),
  cancelOrder: (orderId: number) => client.delete(`/snacks/orders/${orderId}`),
};

export const adminSnacksService = {
  extractMenu: (imageUrl: string) =>
    client.post('/admin/snacks/upload', { imageUrl }),
  createMenu: (data: { title?: string; imageUrl?: string; items: { name: string; price: number }[] }) =>
    client.post('/admin/snacks/menus', data),
  getMenus: () => client.get('/admin/snacks/menus'),
  getMenu: (id: number) => client.get(`/admin/snacks/menus/${id}`),
  activateMenu: (id: number) => client.post(`/admin/snacks/menus/${id}/activate`),
  getMenuOrders: (id: number) => client.get(`/admin/snacks/menus/${id}/orders`),
  finalizeMenu: (id: number) => client.post(`/admin/snacks/menus/${id}/finalize`),
  cancelMenu: (id: number) => client.post(`/admin/snacks/menus/${id}/cancel`),
};

import client from '../client';

export const snacksService = {
  getMenus: () => client.get('/snacks/menus'),
  getActiveMenu: () => client.get('/snacks/menus/active'),
  getMenu: (id: number) => client.get(`/snacks/menus/${id}`),
  createMenu: (data: { title: string; items: { name: string; price: number; description?: string }[] }) =>
    client.post('/snacks/menus', data),
  activateMenu: (id: number) => client.post(`/snacks/menus/${id}/activate`),
  getMenuOrders: (id: number) => client.get(`/snacks/menus/${id}/orders`),
  finalizeMenu: (id: number) => client.post(`/snacks/menus/${id}/finalize`),
  cancelMenu: (id: number) => client.post(`/snacks/menus/${id}/cancel`),
  extractFromImage: (imageUrl: string) => client.post('/snacks/upload', { imageUrl }),
  extractFromFile: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    // Remove Content-Type so browser sets multipart/form-data with correct boundary
    return client.post('/snacks/upload', formData, {
      headers: { 'Content-Type': undefined },
    });
  },
  placeOrder: (menuId: number, items: { itemId: number; quantity: number }[]) =>
    client.post('/snacks/orders', { menuId, items }),
  getMyOrders: () => client.get('/snacks/orders/my'),
  updateOrder: (orderId: number, quantity: number) =>
    client.put(`/snacks/orders/${orderId}`, { quantity }),
  cancelOrder: (orderId: number) => client.delete(`/snacks/orders/${orderId}`),
};

// Kept for backward compat
export const adminSnacksService = snacksService;

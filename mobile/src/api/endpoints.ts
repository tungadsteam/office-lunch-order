export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  
  // Orders
  ORDERS_TODAY: '/orders/today',
  ORDERS_JOIN: '/orders/today/join',
  ORDERS_LEAVE: '/orders/today/leave',
  ORDERS_SELECT_BUYERS: '/orders/today/select-buyers',
  ORDERS_PAYMENT: '/orders/today/payment',
  ORDERS_HISTORY: '/orders/history',
  ORDER_DETAIL: (id: number) => `/orders/${id}`,
  
  // Transactions
  DEPOSIT: '/transactions/deposit',
  PENDING_DEPOSITS: '/transactions/pending',
  APPROVE_DEPOSIT: (id: number) => `/transactions/${id}/approve`,
  REJECT_DEPOSIT: (id: number) => `/transactions/${id}/reject`,
  TRANSACTION_HISTORY: '/transactions/history',
  
  // Admin
  ADMIN_STATS: '/admin/stats',
  BANK_INFO: '/admin/bank-info',
  ADMIN_USERS: '/admin/users',
  ADJUST_BALANCE: (id: number) => `/admin/users/${id}/balance`,
};

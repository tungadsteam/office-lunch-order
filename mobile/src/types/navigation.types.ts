export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  OrderToday: undefined;
  Payment: undefined;
  History: undefined;
  Profile: undefined;
  Deposit: undefined;
  OrderDetail: { sessionId: number };
  TransactionHistory: undefined;
  // Admin
  AdminDashboard: undefined;
  PendingDeposits: undefined;
  UsersList: undefined;
};

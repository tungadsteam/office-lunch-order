// API Configuration
export const API_BASE_URL = 'http://localhost:3000/api';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: '@lunch_fund_token',
  USER: '@lunch_fund_user',
};

// Colors
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  background: '#F2F2F7',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8E8E93',
  lightGray: '#C7C7CC',
  darkGray: '#48484A',
  text: '#1C1C1E',
  textSecondary: '#3A3A3C',
  border: '#E5E5EA',
};

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Order Status Labels
export const ORDER_STATUS_LABELS = {
  ordering: 'Đang nhận đặt',
  buyers_selected: 'Đã chọn người mua',
  buying: 'Đang mua',
  payment_submitted: 'Đã thanh toán',
  settled: 'Đã quyết toán',
  cancelled: 'Đã hủy',
};

// Transaction Type Labels
export const TRANSACTION_TYPE_LABELS = {
  deposit: 'Nạp tiền',
  income: 'Thu nhập',
  expense: 'Chi phí',
  refund: 'Hoàn tiền',
  adjustment: 'Điều chỉnh',
};

// Transaction Status Labels
export const TRANSACTION_STATUS_LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
  completed: 'Hoàn thành',
};

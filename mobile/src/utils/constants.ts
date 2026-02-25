export const API_BASE_URL = 'http://localhost:3000/api';

export const STORAGE_KEYS = {
  TOKEN: '@lunch_fund_token',
  USER: '@lunch_fund_user',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  ordering: 'Đang nhận đặt',
  buyers_selected: 'Đã chọn người mua',
  buying: 'Đang mua',
  payment_submitted: 'Đã thanh toán',
  settled: 'Đã quyết toán',
  cancelled: 'Đã hủy',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  deposit: 'Nạp tiền',
  income: 'Thu nhập',
  expense: 'Chi phí',
  refund: 'Hoàn tiền',
  adjustment: 'Điều chỉnh',
};

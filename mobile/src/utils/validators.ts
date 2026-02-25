export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email là bắt buộc';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Email không hợp lệ';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Mật khẩu là bắt buộc';
  if (password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Họ tên là bắt buộc';
  if (name.trim().length < 2) return 'Họ tên tối thiểu 2 ký tự';
  return null;
}

export function validateAmount(amount: string): string | null {
  const num = parseInt(amount.replace(/[^0-9]/g, ''), 10);
  if (!num || num <= 0) return 'Số tiền phải lớn hơn 0';
  return null;
}

import axios from 'axios';

// Prefer NEXT_PUBLIC_API_BASE_URL (new name) but keep backwards compatibility with NEXT_PUBLIC_API_URL.
// NOTE: NEXT_PUBLIC_* vars are inlined at build time by Next.js.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || 'Lỗi kết nối';
    return Promise.reject(new Error(message));
  }
);

export default client;

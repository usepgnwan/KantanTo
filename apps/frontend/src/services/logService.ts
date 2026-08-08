import axios from 'axios';

const backendUrl = process.env.REACT_APP_LINK_BACKEND || 'http://127.0.0.1:3026/api';
const secretKey = process.env.REACT_APP_SECRET_BACKEND || 'Z9ToSwagger1413999';

const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'secret-to-apps': secretKey,
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RecordLogPayload {
  path: string;
  label: string;
  device: string;
  user_id?: number;
}

export interface MenuLogResponse {
  id: number;
  path: string;
  label: string;
  device: string;
  user?: { name: string; email: string };
  created_at: string;
}

export const recordMenuLogAPI = async (payload: RecordLogPayload): Promise<void> => {
  try {
    await api.post('/logs/menu', payload);
  } catch (error) {
    console.error('Failed to record menu log:', error);
  }
};

export const getMenuLogsAPI = async (): Promise<MenuLogResponse[]> => {
  const response = await api.get('/logs/menu');
  return response.data?.data || [];
};

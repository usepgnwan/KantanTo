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
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse {
  total: number;
  rows: ContactMessage[];
  currentPage: number;
  perPage: number;
}

export const submitContactMessage = async (data: { name: string; email: string; subject: string; message: string }): Promise<ContactMessage> => {
  const response = await api.post('/contact/submit', data);
  return response.data.data;
};

export const getContactMessages = async (page: number, limit: number, search?: string): Promise<PaginatedResponse> => {
  const params: any = { page, limit };
  if (search) params.search = search;
  const response = await api.get('/admin/contacts', { params });
  return response.data.data;
};

export const getContactMessageById = async (id: number): Promise<ContactMessage> => {
  const response = await api.get(`/admin/contacts/${id}`);
  return response.data.data;
};

export const deleteContactMessage = async (id: number): Promise<void> => {
  await api.delete(`/admin/contacts/${id}`);
};

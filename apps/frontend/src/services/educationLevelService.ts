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

// Interceptor untuk menambahkan token dari localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface EducationLevel {
  id: number;
  title: string;
  deskripsi: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse {
  total: number;
  rows: EducationLevel[];
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
  lastPage: number;
}

export const getEducationLevels = async (page: number, limit: number, title?: string): Promise<PaginatedResponse> => {
  const params: any = { page, limit };
  if (title) params.title = title;
  
  const response = await api.get('/education-level', { params });
  return response.data.data;
};

export const getEducationLevelById = async (id: number): Promise<EducationLevel> => {
  const response = await api.get(`/education-level/${id}`);
  return response.data.data;
};

export const createEducationLevel = async (data: { title: string; deskripsi: string }): Promise<EducationLevel> => {
  const response = await api.post('/education-level', data);
  return response.data.data;
};

export const updateEducationLevel = async (id: number, data: { title: string; deskripsi: string }): Promise<EducationLevel> => {
  const response = await api.put(`/education-level/${id}`, data);
  return response.data.data;
};

export const deleteEducationLevel = async (id: number): Promise<void> => {
  await api.delete(`/education-level/${id}`);
};

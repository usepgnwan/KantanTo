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

export interface Grade {
  id: number;
  title: string;
  deskripsi: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse {
  total: number;
  rows: Grade[];
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
  lastPage: number;
}

export const getGrades = async (page: number, limit: number, title?: string): Promise<PaginatedResponse> => {
  const params: any = { page, limit };
  if (title) params.title = title;
  
  const response = await api.get('/grade', { params });
  return response.data.data;
};

export const getGradeById = async (id: number): Promise<Grade> => {
  const response = await api.get(`/grade/${id}`);
  return response.data.data;
};

export const createGrade = async (data: { title: string; deskripsi: string }): Promise<Grade> => {
  const response = await api.post('/grade', data);
  return response.data.data;
};

export const updateGrade = async (id: number, data: { title: string; deskripsi: string }): Promise<Grade> => {
  const response = await api.put(`/grade/${id}`, data);
  return response.data.data;
};

export const deleteGrade = async (id: number): Promise<void> => {
  await api.delete(`/grade/${id}`);
};

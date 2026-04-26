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

export interface Category {
  id: number;
  title: string;
  deskripsi: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse {
  total: number;
  rows: Category[];
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
  lastPage: number;
}

export const getCategories = async (page: number, limit: number, title?: string): Promise<PaginatedResponse> => {
  const params: any = { page, limit };
  if (title) params.title = title;
  
  const response = await api.get('/category', { params });
  return response.data.data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await api.get(`/category/${id}`);
  return response.data.data;
};

export const createCategory = async (data: { title: string; deskripsi: string }): Promise<Category> => {
  const response = await api.post('/category', data);
  return response.data.data;
};

export const updateCategory = async (id: number, data: { title: string; deskripsi: string }): Promise<Category> => {
  const response = await api.put(`/category/${id}`, data);
  return response.data.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/category/${id}`);
};

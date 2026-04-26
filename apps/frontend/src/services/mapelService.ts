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

export interface Mapel {
  id: number;
  title: string;
  deskripsi: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse {
  total: number;
  rows: Mapel[];
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
  lastPage: number;
}

export const getMapels = async (page: number, limit: number, title?: string): Promise<PaginatedResponse> => {
  const params: any = { page, limit };
  if (title) params.title = title;
  
  const response = await api.get('/mapel', { params });
  return response.data.data;
};

export const getMapelById = async (id: number): Promise<Mapel> => {
  const response = await api.get(`/mapel/${id}`);
  return response.data.data;
};

export const createMapel = async (data: { title: string; deskripsi: string }): Promise<Mapel> => {
  const response = await api.post('/mapel', data);
  return response.data.data;
};

export const updateMapel = async (id: number, data: { title: string; deskripsi: string }): Promise<Mapel> => {
  const response = await api.put(`/mapel/${id}`, data);
  return response.data.data;
};

export const deleteMapel = async (id: number): Promise<void> => {
  await api.delete(`/mapel/${id}`);
};

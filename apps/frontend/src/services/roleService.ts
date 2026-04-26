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

export interface Role {
  id: number;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse {
  total: number;
  rows: Role[];
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
  lastPage: number;
}

export const getRoles = async (page: number, limit: number, search?: string): Promise<PaginatedResponse> => {
  const params: any = { page, limit };
  if (search) params.search = search;
  
  const response = await api.get('/role', { params });
  return response.data.data;
};

export const getRoleById = async (id: number): Promise<Role> => {
  const response = await api.get(`/role/${id}`);
  return response.data.data;
};

export const createRole = async (data: { title: string }): Promise<Role> => {
  const response = await api.post('/role', data);
  return response.data.data;
};

export const updateRole = async (id: number, data: { title: string }): Promise<Role> => {
  const response = await api.put(`/role/${id}`, data);
  return response.data.data;
};

export const deleteRole = async (id: number): Promise<void> => {
  await api.delete(`/role/${id}`);
};

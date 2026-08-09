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
}

export interface User {
  id: number;
  name: string;
  email: string;
  nohp: string;
  status: string; // 'aktif' | 'pending' | 'non-aktif'
  asal_sekolah: string;
  foto_profil?: string;
  role_id: number;
  role: Role;
  dream_description?: string;
  target_campus?: string;
  target_major?: string;
  target_point?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export interface PaginatedUserResponse {
  total: number;
  rows: User[];
  currentPage: number;
  perPage: number;
  from: number;
  to: number;
  lastPage: number;
}

export const getUsers = async (page: number, limit: number, search?: string): Promise<PaginatedUserResponse> => {
  const params: any = { page, limit };
  if (search) params.search = search;
  
  const response = await api.get('/user', { params });
  return response.data.data;
};

export const registerUser = async (data: { name: string; email: string; nohp: string; password: string; asal_sekolah?: string }): Promise<User> => {
  const response = await api.post('/user/register', data);
  return response.data.data;
};

export interface LoginResponse {
  token: string;
  roleid: number; // extracted from jwt payload after parsing
  user: User;
}

export const loginUser = async (data: { email: string; password: string }): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', data);
  const { token, user } = response.data.data;

  // Decode roleid from JWT payload (base64 decode middle part)
  let roleid = 2;
  try {
    const payloadBase64 = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));
    roleid = decoded.roleid ?? 2;
  } catch {}

  return { token, roleid, user };
};

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  nohp?: string;
  asal_sekolah?: string;
  dream_description?: string;
  target_campus?: string;
  target_major?: string;
  target_point?: string;
}

export const getProfileAPI = async (id: number): Promise<User> => {
  const response = await api.get(`/user/profile/${id}`);
  return response.data.data;
};

export const updateProfileAPI = async (id: number, payload: UpdateProfilePayload): Promise<User> => {
  const response = await api.put(`/user/profile/${id}`, payload);
  return response.data.data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, new_password: string): Promise<{ message: string }> => {
  const response = await api.post('/auth/reset-password', { token, new_password });
  return response.data;
};

export const googleLogin = async (code: string): Promise<LoginResponse & { bearer?: string }> => {
  const response = await api.post('/auth/google', { code });
  const { token, bearer, user } = response.data.data;

  // Save raw token in standard localStorage for interceptors
  if (token) localStorage.setItem('token', token);

  // Decode roleid from JWT payload (base64 decode middle part)
  let roleid = 2;
  try {
    const payloadBase64 = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));
    roleid = decoded.roleid ?? 2;
  } catch {}

  return { token, bearer, roleid, user };
};

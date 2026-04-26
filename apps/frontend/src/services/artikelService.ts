import axios from 'axios';

const backendUrl = process.env.REACT_APP_LINK_BACKEND || 'http://127.0.0.1:3026/api';
const secretKey = process.env.REACT_APP_SECRET_BACKEND || 'Z9ToSwagger1413999';

const api = axios.create({
  baseURL: backendUrl,
  headers: { 'secret-to-apps': secretKey },
});

export interface ArtikelUser {
  id: number;
  name: string;
  email: string;
}

export interface ArtikelCategory {
  id: number;
  title: string;
}

export interface Artikel {
  id: number;
  judul: string;
  slug: string;
  konten: string;
  deskripsi: string;
  thumbnail: string;
  berkas: string;
  status: 'publish' | 'draft';
  is_priority: boolean;
  category_id: number | null;
  category: ArtikelCategory;
  user_id: number | null;
  user: ArtikelUser;
  created_at: string;
  updated_at: string;
}

export interface ArtikelListResponse {
  headline: Artikel | null;
  list: {
    total: number;
    rows: Artikel[];
    currentPage: number;
    perPage: number;
    lastPage: number;
  };
}

export const getArtikel = async (
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
): Promise<ArtikelListResponse> => {
  const params: any = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  const response = await api.get('/artikel', { params });
  return response.data.data;
};

export const getArtikelById = async (id: number): Promise<Artikel> => {
  const response = await api.get(`/artikel/${id}`);
  return response.data.data;
};

export const createArtikel = async (formData: FormData): Promise<Artikel> => {
  const response = await api.post('/artikel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const updateArtikel = async (id: number, formData: FormData): Promise<Artikel> => {
  const response = await api.put(`/artikel/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const deleteArtikel = async (id: number): Promise<void> => {
  await api.delete(`/artikel/${id}`);
};

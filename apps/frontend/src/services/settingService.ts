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

export interface Setting {
  id?: number;
  nama_aplikasi: string;
  deskripsi: string;
  no_wa: string;
  email: string;
  alamat: string;
  ppn?: number;
  created_at?: string;
  updated_at?: string;
}

export const getSetting = async (): Promise<Setting> => {
  const response = await api.get('/setting');
  return response.data.data;
};

export const updateSetting = async (data: Setting): Promise<Setting> => {
  const response = await api.put('/setting', data);
  return response.data.data;
};

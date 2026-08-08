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

export interface Voucher {
  key?: string; // mapping to frontend
  id?: number;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  limit: number;
  used: number;
  expiryDate: string;
  status?: 'active' | 'expired' | 'finished';
}

export interface VoucherUsage {
  id: string;
  orderId: string;
  user: string;
  package: string;
  amount: number;
  date: string;
}

const unwrapList = (data: any): any[] => {
  const payload = data?.data ?? data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapItem = (data: any): any => data?.data ?? data;

const normalizeVoucher = (v: any): Voucher => ({
  key: String(v.id),
  id: v.id,
  code: v.code || '',
  type: v.type || 'percentage',
  value: Number(v.value) || 0,
  limit: Number(v.limit) || 0,
  used: Number(v.used) || 0,
  expiryDate: v.expiryDate || '',
  status: v.status || 'active',
});

export const getVouchers = async (): Promise<Voucher[]> => {
  const response = await api.get('/vouchers');
  return unwrapList(response.data).map(normalizeVoucher);
};

export const createVoucher = async (payload: Partial<Voucher>): Promise<Voucher> => {
  const response = await api.post('/vouchers', payload);
  return normalizeVoucher(unwrapItem(response.data));
};

export const updateVoucher = async (id: number | string, payload: Partial<Voucher>): Promise<Voucher> => {
  const response = await api.put(`/vouchers/${id}`, payload);
  return normalizeVoucher(unwrapItem(response.data));
};

export const deleteVoucher = async (id: number | string): Promise<void> => {
  await api.delete(`/vouchers/${id}`);
};

export const applyVoucherAPI = async (code: string, userId: number): Promise<Voucher> => {
  const response = await api.post('/vouchers/apply', { code, user_id: userId });
  return normalizeVoucher(unwrapItem(response.data));
};

export const recordVoucherUsageAPI = async (payload: { voucher_id: number; user_id: number; order_id: string; package_id: number; amount: number; date: string }): Promise<void> => {
  await api.post('/vouchers/record-usage', payload);
};

export const getVoucherUsageHistoryAPI = async (id: number | string): Promise<VoucherUsage[]> => {
  const response = await api.get(`/vouchers/${id}/usage`);
  return unwrapList(response.data).map((u: any) => ({
    id: String(u.id),
    orderId: u.order_id,
    user: u.user?.name || '-',
    package: u.package?.title || '-',
    amount: u.amount,
    date: new Date(u.created_at).toLocaleString('id-ID'),
  }));
};

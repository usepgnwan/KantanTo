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

export interface CheckoutRequest {
  user_id: number;
  package_slug: string;
  voucher_code?: string;
}

export interface TransactionResponse {
  id: number;
  invoice_code: string;
  order_id: string;
  user_id: number;
  package_id: number;
  voucher_id: number | null;
  voucher?: { code: string; discount_percentage: number; title: string };
  amount: number;
  payment_method: string;
  status: string;
  active_until: string | null;
  is_lifetime: boolean;
  max_exam_attempts: number;
  used_exam_attempts: number;
  created_at?: string;
}

export const checkoutAPI = async (payload: CheckoutRequest): Promise<TransactionResponse> => {
  const response = await api.post('/checkout', payload);
  const data = response.data?.data ?? response.data;
  return data as TransactionResponse;
};

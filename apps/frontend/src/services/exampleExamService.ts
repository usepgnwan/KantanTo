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

export interface ExampleExam {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string;
  explanation: string;
  created_at?: string;
  updated_at?: string;
}

export const getExampleExams = async (page: number, limit: number, query: string) => {
  const response = await api.get('/example-exam', {
    params: { page, limit, question: query },
  });
  return response.data.data;
};

export const getRandomExampleExam = async () => {
  const response = await api.get('/example-exam/random');
  return response.data;
};

export const createExampleExam = async (data: Partial<ExampleExam>) => {
  const response = await api.post('/example-exam', data);
  return response.data;
};

export const updateExampleExam = async (id: number, data: Partial<ExampleExam>) => {
  const response = await api.put(`/example-exam/${id}`, data);
  return response.data;
};

export const deleteExampleExam = async (id: number) => {
  const response = await api.delete(`/example-exam/${id}`);
  return response.data;
};

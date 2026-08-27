import axios from 'axios';
import { PackageListItem } from './packageService';

const backendUrl = process.env.REACT_APP_LINK_BACKEND || 'http://127.0.0.1:3026/api';
const secretKey = process.env.REACT_APP_SECRET_BACKEND || 'Z9ToSwagger1413999';

const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'secret-to-apps': secretKey,
    'Content-Type': 'application/json',
  },
});

export interface StudySchedule {
  id: number;
  user_id: number;
  date: string;
  type: 'latihan' | 'reminder';
  package_id?: number;
  package?: PackageListItem;
  reminder_text: string;
}

export const getSchedulesAPI = async (userId: number): Promise<StudySchedule[]> => {
  const response = await api.get(`/user/schedules?user_id=${userId}`);
  const data = response.data?.data ?? response.data;
  return data as StudySchedule[];
};

export interface CreateSchedulePayload {
  user_id: number;
  date: string; // YYYY-MM-DD
  type: 'latihan' | 'reminder';
  package_id?: number;
  reminder_text?: string;
}

export const createScheduleAPI = async (payload: CreateSchedulePayload): Promise<StudySchedule> => {
  const response = await api.post('/user/schedules', payload);
  const data = response.data?.data ?? response.data;
  return data as StudySchedule;
};

export const deleteScheduleAPI = async (id: number): Promise<boolean> => {
  try {
    const response = await api.delete(`/user/schedules/${id}`);
    return response.data?.status === true;
  } catch (error) {
    console.error('Failed to delete schedule', error);
    return false;
  }
};

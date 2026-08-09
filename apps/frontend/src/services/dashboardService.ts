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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserDashboardStats {
  total_packages: number;
  total_exams: number;
  avg_score: number;
  study_hours: number;
  accuracy_data: { day: string; accuracy: number; error: number }[];
  recommendation?: {
    subject: string;
    potential_points: number;
    package_slug: string;
    material_id: number;
  };
  is_top_5?: boolean;
  is_profile_complete?: boolean;
  dream_description?: string;
  target_campus?: string;
  target_major?: string;
  target_point?: string;
}

export const getUserDashboardStatsAPI = async (userId: number): Promise<UserDashboardStats | null> => {
  try {
    const response = await api.get('/dashboard/user-stats', {
      params: { user_id: userId }
    });
    return response.data?.data || null;
  } catch (error) {
    console.error('Failed to fetch user dashboard stats:', error);
    return null;
  }
};

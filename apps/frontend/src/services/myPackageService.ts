import axios from 'axios';
import { TransactionResponse } from './checkoutService';
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

export interface PackageMaterial {
  id: number;
  package_id: number;
  client_id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
}

export interface MyPackageItem extends PackageListItem {
  id: number;
  materials: PackageMaterial[];
}

export interface MyTransaction extends TransactionResponse {
  package: MyPackageItem;
  progress: number;
}

export const getMyPackagesAPI = async (userId: number): Promise<MyTransaction[]> => {
  const response = await api.get(`/user/packages?user_id=${userId}`);
  const data = response.data?.data ?? response.data;
  return data as MyTransaction[];
};

export const markMaterialAsReadAPI = async (userId: number, packageId: number, materialId: number): Promise<boolean> => {
  try {
    const response = await api.post('/user/progress', {
      user_id: userId,
      package_id: packageId,
      material_id: materialId,
    });
    return response.data?.status === true;
  } catch (error) {
    console.error('Failed to mark material as read', error);
    return false;
  }
};

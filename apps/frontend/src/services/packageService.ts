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

// ─── Package List CRUD ───────────────────────────────────────────────────────

export interface PackageListItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: number;
  category: string;
  classes: string[];
  subjects: string[];
  duration: number;
  status: 'published' | 'draft' | 'deleted';
  thumbnail: string;
  questions_count: number;
  materials_count: number;
  videos_count: number;
}

export interface PackagePayload {
  slug: string;
  title: string;
  description: string;
  price: number;
  category: string;
  classes: string[];
  subjects: string[];
  duration: number;
  status: string;
  thumbnail?: string;
}

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      return trimmed.split(',').map(item => item.trim()).filter(Boolean);
    }
  }

  return [];
};

const normalizeStatus = (value: unknown): PackageListItem['status'] => {
  if (value === 'published' || value === 'deleted' || value === 'draft') {
    return value;
  }
  return 'draft';
};

const normalizePackage = (pkg: any): PackageListItem => ({
  id: Number(pkg?.id) || 0,
  slug: String(pkg?.slug || ''),
  title: String(pkg?.title || ''),
  description: String(pkg?.description || ''),
  price: Number(pkg?.price) || 0,
  category: String(pkg?.category || ''),
  classes: asStringArray(pkg?.classes ?? pkg?.Classes),
  subjects: asStringArray(pkg?.subjects ?? pkg?.Subjects),
  duration: Number(pkg?.duration) || 0,
  status: normalizeStatus(pkg?.status),
  thumbnail: String(pkg?.thumbnail || ''),
  questions_count: Number(pkg?.questions_count) || 0,
  materials_count: Number(pkg?.materials_count) || 0,
  videos_count: Number(pkg?.videos_count) || 0,
});

const unwrapList = (data: any): any[] => {
  const payload = data?.data ?? data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const unwrapItem = (data: any): any => data?.data ?? data;

export const getPackages = async (): Promise<PackageListItem[]> => {
  const response = await api.get('/packages');
  return unwrapList(response.data).map(normalizePackage).filter(pkg => pkg.slug);
};

export const getPackageBySlug = async (slug: string): Promise<PackageListItem | undefined> => {
  const packages = await getPackages();
  return packages.find(pkg => pkg.slug === slug);
};

export const createPackage = async (payload: PackagePayload): Promise<PackageListItem> => {
  const response = await api.post('/packages', payload);
  return normalizePackage(unwrapItem(response.data));
};

export const updatePackage = async (slug: string, payload: Partial<PackagePayload>): Promise<PackageListItem> => {
  const response = await api.put(`/packages/${slug}`, payload);
  return normalizePackage(unwrapItem(response.data));
};

export const deletePackage = async (slug: string): Promise<void> => {
  await api.delete(`/packages/${slug}`);
};


export type QuestionType = 'single' | 'multiple' | 'nested';
export type ScoringMethod = 'all_or_nothing' | 'partial';

export interface PackageSubQuestionPayload {
  id: string;
  type?: QuestionType;
  question: string;
  discussion: string;
  options: string[];
  correct: number | number[];
  points: number;
}

export interface PackageQuestionPayload {
  id: string;
  type: QuestionType;
  title: string;
  question: string;
  discussion: string;
  options: string[];
  correct: number | number[];
  discussion_refs: string[];
  points: number;
  scoring_method: ScoringMethod;
  sub_questions?: PackageSubQuestionPayload[];
}

export interface PackageMaterialPayload {
  id: string;
  client_id?: string;
  title: string;
  category: string;
  content: string;
  attachments?: string[];
}

export interface PackageVideoPayload {
  id: string;
  title: string;
  duration: string;
  url: string;
  description: string;
  media_type?: string;
}

const normalizeCorrect = (correct: unknown): number | number[] => {
  if (Array.isArray(correct)) return correct.map(Number);
  if (typeof correct === 'number') return correct;
  return 0;
};

const normalizeQuestion = (question: any): PackageQuestionPayload => ({
  id: String(question.id),
  type: question.type,
  title: question.title || '',
  question: question.question || '',
  discussion: question.discussion || '',
  options: question.options || ['', '', '', '', ''],
  correct: normalizeCorrect(question.correct),
  discussion_refs: question.discussion_refs || [],
  points: Number(question.points) || 0,
  scoring_method: question.scoring_method || 'all_or_nothing',
  sub_questions: (question.sub_questions || []).map((sub: any) => ({
    id: String(sub.id),
    type: sub.type || 'single',
    question: sub.question || '',
    discussion: sub.discussion || '',
    options: sub.options || ['', '', '', '', ''],
    correct: normalizeCorrect(sub.correct),
    points: Number(sub.points) || 0,
  })),
});

const normalizeMaterial = (material: any): PackageMaterialPayload => ({
  id: String(material.id),
  client_id: material.client_id || '',
  title: material.title || '',
  category: material.category || 'Umum',
  content: material.content || '',
  attachments: material.attachments || [],
});

const normalizeVideo = (video: any): PackageVideoPayload => ({
  id: String(video.id),
  title: video.title || '',
  duration: video.duration || '',
  url: video.url || '',
  description: video.description || '',
  media_type: video.media_type || 'video',
});

export const getPackageQuestions = async (slug: string): Promise<PackageQuestionPayload[]> => {
  const response = await api.get(`/packages/${slug}/questions`);
  return (response.data.data || []).map(normalizeQuestion);
};

export const savePackageQuestion = async (slug: string, question: PackageQuestionPayload): Promise<PackageQuestionPayload> => {
  const response = await api.post(`/packages/${slug}/questions`, question);
  return normalizeQuestion(response.data.data);
};

export const savePackageQuestions = async (slug: string, questions: PackageQuestionPayload[]): Promise<PackageQuestionPayload[]> => {
  const response = await api.put(`/packages/${slug}/questions`, questions);
  return (response.data.data || []).map(normalizeQuestion);
};

export const getPackageMaterials = async (slug: string): Promise<PackageMaterialPayload[]> => {
  const response = await api.get(`/packages/${slug}/materials`);
  return (response.data.data || []).map(normalizeMaterial);
};

export const savePackageMaterial = async (slug: string, material: PackageMaterialPayload): Promise<PackageMaterialPayload> => {
  const response = await api.post(`/packages/${slug}/materials`, material);
  return normalizeMaterial(response.data.data);
};

export const savePackageMaterials = async (slug: string, materials: PackageMaterialPayload[]): Promise<PackageMaterialPayload[]> => {
  const response = await api.put(`/packages/${slug}/materials`, materials);
  return (response.data.data || []).map(normalizeMaterial);
};

export const deletePackageMaterial = async (slug: string, materialId: string): Promise<void> => {
  await api.delete(`/packages/${slug}/materials/${materialId}`);
};

export const getPackageVideos = async (slug: string): Promise<PackageVideoPayload[]> => {
  const response = await api.get(`/packages/${slug}/videos`);
  return (response.data.data || []).map(normalizeVideo);
};

export const savePackageVideo = async (slug: string, video: PackageVideoPayload): Promise<PackageVideoPayload> => {
  const response = await api.post(`/packages/${slug}/videos`, video);
  return normalizeVideo(response.data.data);
};

export const savePackageVideos = async (slug: string, videos: PackageVideoPayload[]): Promise<PackageVideoPayload[]> => {
  const response = await api.put(`/packages/${slug}/videos`, videos);
  return (response.data.data || []).map(normalizeVideo);
};

export const deletePackageVideo = async (slug: string, videoId: string): Promise<void> => {
  await api.delete(`/packages/${slug}/videos/${videoId}`);
};

export interface ExamSubmitPayload {
  client_id: string;
  user_id: number;
  is_testing: boolean;
  answers: Record<number, number[]>; // QuestionID -> array of selected options
}

export const submitExam = async (slug: string, payload: ExamSubmitPayload): Promise<any> => {
  const response = await api.post(`/packages/${slug}/submit`, payload);
  return response.data.data;
};

export const getExamSession = async (sessionId: string) => {
  const { data } = await api.get(`/exam-sessions/${sessionId}`);
  return data.data;
};

export const getAdminExamSessions = async (isTesting: boolean, page: number = 1, limit: number = 10, search?: string, user_id?: number) => {
  const params = new URLSearchParams({
    is_testing: String(isTesting),
    page: String(page),
    limit: String(limit)
  });
  
  if (search) {
    params.append('search', search);
  }
  
  if (user_id) {
    params.append('user_id', String(user_id));
  }

  const { data } = await api.get(`/admin/exam-sessions?${params.toString()}`);
  return data.data;
};

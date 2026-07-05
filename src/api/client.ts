import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.29.9.54:8000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@shop_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) await AsyncStorage.removeItem('@shop_token');
    return Promise.reject(err);
  }
);

export const authService = { login: (d: any) => api.post('/auth/login', d) };
export const dashboardService = { get: () => api.get('/dashboard') };
export const stockService = {
  getAll: (date?: string) => api.get('/stocks', { params: { date } }),
  setMatin: (stocks: any[]) => api.post('/stocks/matin', { stocks }),
  setSoir: (stocks: any[]) => api.post('/stocks/soir', { stocks }),
  vendre: (d: any) => api.post('/stocks/vendre', d),
};
export const mmService = {
  getAll: () => api.get('/mm/transactions'),
  create: (d: any) => api.post('/mm/transactions', d),
  update: (id: number, d: any) => api.put(`/mm/transactions/${id}`, d),
  delete: (id: number) => api.delete(`/mm/transactions/${id}`),
};
export const caisseService = {
  getResume: () => api.get('/caisse/resume'),
  getEtat: () => api.get('/caisse/etat'),
  setMatin: (d: any) => api.post('/caisse/matin', d),
  setSoir: (d: any) => api.post('/caisse/soir', d),
  cloturer: () => api.post('/caisse/cloturer'),
  rouvrir: () => api.post('/caisse/rouvrir'),
};
export const articleService = {
  getAll: () => api.get('/articles'),
  create: (d: any) => api.post('/articles', d),
  updateSoir: (id: number, r: number) => api.put(`/articles/${id}`, { restant_soir: r }),
  delete: (id: number) => api.delete(`/articles/${id}`),
};
export const detteService = {
  getAll: () => api.get('/dettes'),
  create: (d: any) => api.post('/dettes', d),
  rembourser: (id: number, m: number) => api.post(`/dettes/${id}/rembourser`, { montant: m }),
  annuler: (id: number) => api.delete(`/dettes/${id}`),
};
export const objectifService = {
  getSemaine: () => api.get('/objectif'),
  updateJour: (id: number, d: any) => api.put(`/objectif/jour/${id}`, d),
  addRevenu: (d: any) => api.post('/objectif/autres-revenus', d),
  deleteRevenu: (id: number) => api.delete(`/objectif/autres-revenus/${id}`),
};
export const settingsService = {
  get: () => api.get('/settings'),
  update: (d: any) => api.put('/settings', d),
  getTaux: () => api.get('/taux/actif'),
  updateTaux: (d: any) => api.post('/taux', d),
};
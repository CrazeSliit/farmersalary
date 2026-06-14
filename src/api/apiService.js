import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Network error. Please check your connection.';
    return Promise.reject(new Error(message));
  }
);

// ── Farmer API ────────────────────────────────────────────────────────────────
export const farmerApi = {
  getAll:   (params = {}) => api.get('/farmers', { params }),
  getById:  (id)          => api.get(`/farmers/${id}`),
  create:   (data)        => api.post('/farmers', data),
  update:   (id, data)    => api.put(`/farmers/${id}`, data),
  delete:   (id)          => api.delete(`/farmers/${id}`),
};

// ── Milk Entry API ────────────────────────────────────────────────────────────
export const milkEntryApi = {
  getByFarmer: (farmerId, params = {}) => api.get(`/milk-entries/farmer/${farmerId}`, { params }),
  create:      (data)                  => api.post('/milk-entries', data),
  update:      (id, data)              => api.put(`/milk-entries/${id}`, data),
  delete:      (id)                    => api.delete(`/milk-entries/${id}`),
};

// ── Payment API ───────────────────────────────────────────────────────────────
export const paymentApi = {
  getByFarmer: (farmerId) => api.get(`/payments/farmer/${farmerId}`),
  getById:     (id)       => api.get(`/payments/${id}`),
  generate:    (data)     => api.post('/payments/generate', data),
  delete:      (id)       => api.delete(`/payments/${id}`),
};

// ── Report API ────────────────────────────────────────────────────────────────
export const reportApi = {
  getSummary:      (params)           => api.get('/reports/summary', { params }),
  getDashboardStats: ()               => api.get('/dashboard/stats'),
};

// ── Settings API ──────────────────────────────────────────────────────────────
export const settingsApi = {
  getAll: ()      => api.get('/settings'),
  update: (data)  => api.put('/settings', data),
};

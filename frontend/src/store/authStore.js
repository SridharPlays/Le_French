/* eslint-disable no-unused-vars */
import { create } from 'zustand';
import api from '../api/axiosClient';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  checkSession: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, loading: false });
    } catch (err) {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: (userData) => {
    set({ user: userData, isAuthenticated: true });
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
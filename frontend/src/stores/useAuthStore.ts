// src/stores/useAuthStore.ts
import axios from 'axios';
import { create } from 'zustand';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: `${backendUrl}/api/v1`, // ✅ API-only base URL
});

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/login', { email, password });
            const { user, token } = response.data.data;

      // ✅ Store token
      localStorage.setItem('auth_token', token);

      // ✅ Set Authorization header for all future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error: any) {
      if (error.response?.status === 422) {
        const message = error.response.data.message || 'Invalid credentials';
        throw new Error(message);
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ✅ Clean up
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

    register: async (data) => {
    await api.post('/register', data);
    // Your backend returns user + no token (since not logged in yet)
    // So we just let user go to login, or auto-login if you want
    // Option 1: Auto-login after register (recommended)
    // Option 2: Redirect to login (current behavior)

    // If you want auto-login after register, modify your Laravel register() to also log them in:
    // $token = $user->createToken('spa-token')->plainTextToken;
    // return response()->json(['user' => ..., 'token' => $token], 201);

    // Then here:
    // localStorage.setItem('auth_token', response.token);
    // set({ user: response.user, token: response.token });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      // ✅ Set token for this request
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/me');

      set({
        user: response.data,
        isAuthenticated: true,
      });
    } catch (error) {
      // ✅ Token invalid/expired
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

// ✅ Initialize on app start
useAuthStore.getState().checkAuth();

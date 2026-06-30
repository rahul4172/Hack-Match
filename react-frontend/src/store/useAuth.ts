import { create } from 'zustand';
import { fetchAPI } from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  bio: string;
  skills: string; // JSON string
  winnings: string;
  learnings: string;
  github?: string;
  linkedin?: string;
  avatar?: string;
  public_key?: string;
  location?: string;
  lat?: number;
  lng?: number;
  distance_km?: number;
  synergy_score?: number;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (token: string, user: UserProfile) => void;
  signOut: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const userData = await fetchAPI('/auth/me');
      set({ user: userData, loading: false });
    } catch (err) {
      console.warn("Auth initialization failed, token might be expired.", err);
      localStorage.removeItem('token');
      set({ user: null, loading: false });
    }
  },
  signIn: (token: string, user: UserProfile) => {
    localStorage.setItem('token', token);
    set({ user });
  },
  signOut: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('private_key');
    set({ user: null });
  },
  updateProfile: (profileData: Partial<UserProfile>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...profileData } : null
    }));
  }
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@blind/shared';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  userId: number | null;
  gameId: number | null;
  profile: { nickname: string; avatarId: number } | null;
  setAuth: (token: string, role: UserRole, userId: number, gameId?: number) => void;
  setProfile: (profile: { nickname: string; avatarId: number }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      gameId: null,
      profile: null,
      setAuth: (token, role, userId, gameId) =>
        set({ token, role, userId, gameId: gameId || null }),
      setProfile: (profile) => set({ profile }),
      logout: () =>
        set({ token: null, role: null, userId: null, gameId: null, profile: null }),
    }),
    { name: 'blind-auth' },
  ),
);
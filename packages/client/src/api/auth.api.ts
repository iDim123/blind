import http from './http';
import { AuthResponse, LoginRequest, SetProfileRequest } from '@blind/shared';

export const authApi = {
  login: (data: LoginRequest) =>
    http.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  joinByQr: (qrToken: string) =>
    http.post<AuthResponse & { playerNumber: number }>(`/auth/join/${qrToken}`).then((r) => r.data),

  setProfile: (data: SetProfileRequest) =>
    http.post('/auth/set-profile', data).then((r) => r.data),

  logoutAllPlayers: (gameId: number) =>
    http.post('/auth/logout-all-players', { gameId }).then((r) => r.data),
};
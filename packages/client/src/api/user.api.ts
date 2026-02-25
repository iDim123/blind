import http from './http';

export const userApi = {
  getMe: () => http.get('/users/me').then((r) => r.data),
  getGamePlayers: (gameId: number) =>
    http.get(`/users/game/${gameId}/players`).then((r) => r.data),
};
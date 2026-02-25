import http from './http';

export const qrApi = {
  generate: (gameId: number) =>
    http.get<{ qrDataUrl: string; joinUrl: string }>(`/qr/${gameId}`).then((r) => r.data),

  getToken: (gameId: number) =>
    http.get<{ qrToken: string; joinUrl: string }>(`/qr/${gameId}/token`).then((r) => r.data),
};
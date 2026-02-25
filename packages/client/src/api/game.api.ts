import http from './http';
import { CreateGameRequest, GameResponse, Decision } from '@blind/shared';

export const gameApi = {
  create: (data: CreateGameRequest) =>
    http.post<GameResponse>('/games', data).then((r) => r.data),

  getList: () =>
    http.get<GameResponse[]>('/games').then((r) => r.data),

  getById: (id: number) =>
    http.get<GameResponse>(`/games/${id}`).then((r) => r.data),

  start: (id: number) =>
    http.post(`/games/${id}/start`).then((r) => r.data),

  stop: (id: number) =>
    http.post(`/games/${id}/stop`).then((r) => r.data),

  getPlayerData: () =>
    http.get('/games/current/player-data').then((r) => r.data),

  makeDecision: (decisionId: number, decision: Decision) =>
    http.post('/games/current/make-decision', { decisionId, decision }).then((r) => r.data),
};
import { PlayerBriefInfo } from './game.types';
import { Decision } from './decision.types';

export const WS_EVENTS = {
  // Server -> Client
  PLAYER_JOINED: 'player-joined',
  GAME_STARTED: 'game-started',
  DECISION_MADE: 'decision-made',
  ROUND_RESULT: 'round-result',
  STEP_COMPLETED: 'step-completed',
  GAME_FINISHED: 'game-finished',
  GAME_STOPPED: 'game-stopped',
  FORCE_LOGOUT: 'force-logout',
  ADMIN_UPDATE: 'admin-update',
} as const;

export interface PlayerJoinedEvent {
  connectedPlayers: number;
  player: PlayerBriefInfo;
}

export interface GameStartedEvent {
  gameId: number;
}

export interface DecisionMadeEvent {
  waitingPlayers: PlayerBriefInfo[];
}

export interface RoundResultEvent {
  stepRoundId: number;
  step: number;
  yourDecision: Decision;
  partnerDecision: Decision;
  yourResult: number;
}

export interface StepCompletedEvent {
  newStep: number;
}

export interface GameFinishedEvent {
  finalMessage: string;
}

export interface GameStoppedEvent {
  message: string;
}

export interface AdminUpdateEvent {
  gameId: number;
  timestamp: number;
}
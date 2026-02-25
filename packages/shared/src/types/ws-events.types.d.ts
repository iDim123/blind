import { PlayerBriefInfo } from './game.types';
import { Decision } from './decision.types';
export declare const WS_EVENTS: {
    readonly PLAYER_JOINED: "player-joined";
    readonly GAME_STARTED: "game-started";
    readonly DECISION_MADE: "decision-made";
    readonly ROUND_RESULT: "round-result";
    readonly STEP_COMPLETED: "step-completed";
    readonly GAME_FINISHED: "game-finished";
    readonly GAME_STOPPED: "game-stopped";
    readonly FORCE_LOGOUT: "force-logout";
    readonly ADMIN_UPDATE: "admin-update";
};
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

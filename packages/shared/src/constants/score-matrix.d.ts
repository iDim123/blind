import { Decision } from '../types/decision.types';
export interface ScoreResult {
    scoreA: number;
    scoreB: number;
}
export declare const SCORE_MATRIX: Record<string, ScoreResult>;
export declare function calculateScore(decisionA: Decision, decisionB: Decision): ScoreResult;
export declare const AVATAR_COUNT = 30;
export declare const NICKNAME_MIN_LENGTH = 2;
export declare const NICKNAME_MAX_LENGTH = 20;
export declare const MAX_PLAYERS = 30;
export declare const RECENT_RATING_ROUNDS = 2;

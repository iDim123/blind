import { Decision } from '../types/decision.types';

export interface ScoreResult {
  scoreA: number;
  scoreB: number;
}

export const SCORE_MATRIX: Record<string, ScoreResult> = {
  [`${Decision.AGREE}_${Decision.AGREE}`]: { scoreA: 6, scoreB: 6 },
  [`${Decision.AGREE}_${Decision.INSIST}`]: { scoreA: 0, scoreB: 10 },
  [`${Decision.INSIST}_${Decision.AGREE}`]: { scoreA: 10, scoreB: 0 },
  [`${Decision.INSIST}_${Decision.INSIST}`]: { scoreA: 1, scoreB: 1 },
};

export function calculateScore(decisionA: Decision, decisionB: Decision): ScoreResult {
  const key = `${decisionA}_${decisionB}`;
  const result = SCORE_MATRIX[key];
  if (!result) {
    throw new Error(`Invalid decision combination: ${key}`);
  }
  return result;
}

export const AVATAR_COUNT = 30;
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;
export const MAX_PLAYERS = 30;
export const RECENT_RATING_ROUNDS = 2;
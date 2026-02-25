export enum Decision {
  AGREE = 'AGREE',
  INSIST = 'INSIST',
}

export interface MakeDecisionRequest {
  decisionId: number;
  decision: Decision;
}

export interface RoundResultData {
  stepRoundId: number;
  step: number;
  yourDecision: Decision;
  partnerDecision: Decision;
  yourResult: number;
}
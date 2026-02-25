import { create } from 'zustand';
import { GameStatus, PlayerBriefInfo } from '@blind/shared';

interface StepDataLocal {
  step: number;
  decisionId: number | null;
  decision: string | null;
  result: number | null;
  isSkipped: boolean;
}

interface GameState {
  gameStatus: GameStatus | null;
  gameName: string;
  isOpen: boolean;
  currentStep: number;
  totalPoints: number;
  stepsData: StepDataLocal[];
  waitingPlayers: PlayerBriefInfo[];
  isWaitingForRoundFinish: boolean;
  connectedPlayers: number;
  setGameStatus: (status: GameStatus) => void;
  setGameData: (data: Partial<GameState>) => void;
  updateWaitingPlayers: (players: PlayerBriefInfo[]) => void;
  setConnectedPlayers: (count: number) => void;
  addRoundResult: (step: number, decision: string, result: number) => void;
  advanceStep: (newStep: number) => void;
  setGameFinished: () => void;
  reset: () => void;
}

const initialState = {
  gameStatus: null as GameStatus | null,
  gameName: '',
  isOpen: false,
  currentStep: 1,
  totalPoints: 0,
  stepsData: [] as StepDataLocal[],
  waitingPlayers: [] as PlayerBriefInfo[],
  isWaitingForRoundFinish: false,
  connectedPlayers: 0,
};

export const useGameStore = create<GameState>()((set) => ({
  ...initialState,
  setGameStatus: (status) => set({ gameStatus: status }),
  setGameData: (data) => set((state) => ({ ...state, ...data })),
  updateWaitingPlayers: (players) => set({ waitingPlayers: players }),
  setConnectedPlayers: (count) => set({ connectedPlayers: count }),
  addRoundResult: (step, decision, result) =>
    set((state) => ({
      stepsData: state.stepsData.map((s) =>
        s.step === step ? { ...s, decision, result } : s,
      ),
      totalPoints: state.totalPoints + result,
      isWaitingForRoundFinish: false,
    })),
  advanceStep: (newStep) =>
    set({ currentStep: newStep, isWaitingForRoundFinish: false, waitingPlayers: [] }),
  setGameFinished: () =>
    set({ gameStatus: GameStatus.FINISHED, isWaitingForRoundFinish: false }),
  reset: () => set(initialState),
}));
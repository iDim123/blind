export declare enum GameStatus {
    CREATED = "CREATED",
    STARTED = "STARTED",
    FINISHED = "FINISHED",
    STOPPED = "STOPPED"
}
export interface CreateGameRequest {
    name: string;
    playersCount: number;
    groupsCount: number;
    playersByGroups?: string;
    stepsCount: number;
    isOpen: boolean;
}
export interface GameResponse {
    id: number;
    name: string;
    playersCount: number;
    groupsCount: number;
    playersByGroups: string | null;
    stepsCount: number;
    isOpen: boolean;
    status: GameStatus;
    qrToken: string;
    createdAt: string;
    groups: GroupResponse[];
}
export interface GroupResponse {
    id: number;
    groupIndex: number;
    currentStep: number;
    isFinished: boolean;
}
export interface GameDetailResponse {
    game: GameResponse;
    connectedPlayers: number;
    groups: GroupDetailResponse[];
}
export interface GroupDetailResponse {
    id: number;
    groupIndex: number;
    currentStep: number;
    isFinished: boolean;
    decisionsProgress: string;
    noDecisionPlayers: PlayerBriefInfo[];
    groupTotalPoints: number;
    avgPlayerPointsPerRound: number;
    playersResults: PlayerResultResponse[];
}
export interface PlayerBriefInfo {
    nickname: string;
    avatarId: number;
}
export interface PlayerResultResponse {
    playerProfileId: number;
    nickname: string;
    avatarId: number;
    points: number;
    rating: number | null;
    decisionChain: DecisionChainItem[];
}
export interface DecisionChainItem {
    step: number;
    decision: string | null;
    result: number | null;
    isSkipped: boolean;
}
export interface PlayerDetailResponse {
    player: {
        nickname: string;
        avatarId: number;
        totalPoints: number;
        rating: number | null;
    };
    rounds: PlayerRoundDetail[];
}
export interface PlayerRoundDetail {
    step: number;
    decision: string | null;
    result: number | null;
    isSkipped: boolean;
    partner: {
        nickname: string;
        avatarId: number;
        decision: string | null;
    } | null;
    previousPartnerDecision: string | null;
    context: string;
}
export interface PlayerGameData {
    gameName: string;
    isOpen: boolean;
    gameStatus: GameStatus;
    player: {
        nickname: string;
        avatarId: number;
        totalPoints: number;
    };
    currentStep: number;
    stepsData: StepData[];
    isWaitingForRoundFinish: boolean;
    waitingPlayers: PlayerBriefInfo[];
}
export interface StepData {
    step: number;
    decisionId: number | null;
    decision: string | null;
    result: number | null;
    isSkipped: boolean;
    partner?: PartnerInfo;
}
export interface PartnerInfo {
    nickname: string;
    avatarId: number;
    overallRating: number | null;
    recentRating: number | null;
    ratingAvailable: boolean;
}
export interface FinalStatsResponse {
    gameName: string;
    isOpen: boolean;
    winner: {
        nickname: string;
        avatarId: number;
        totalPoints: number;
    };
    leaderboard: LeaderboardEntry[];
    chartData: {
        cumulativePoints: PlayerChartData[];
        pointsPerRound: PlayerChartData[];
    };
}
export interface LeaderboardEntry {
    rank: number;
    nickname: string;
    avatarId: number;
    totalPoints: number;
    rating: number | null;
}
export interface PlayerChartData {
    playerNickname: string;
    avatarId: number;
    data: {
        step: number;
        points: number;
    }[];
}

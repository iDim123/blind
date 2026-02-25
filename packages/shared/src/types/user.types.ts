export enum UserRole {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  REMOVED = 'REMOVED',
}

export interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface PlayerProfileData {
  id: number;
  userId: number;
  gameId: number;
  nickname: string;
  avatarId: number;
  groupId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
  needsProfile?: boolean;
  gameId?: number;
}

export interface SetProfileRequest {
  nickname: string;
  avatarId: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}
import { GameMode, Level } from '../data/gameData';

export type GameType = 'single' | 'multi';
export type AvatarType = 'male' | 'female' | 'robot';

export type SessionState = 'WAITING_FOR_PLAYERS' | 'READY_TO_START' | 'IN_GAME' | 'PAUSED' | 'ENDED';

export interface Player {
  id: string;
  name: string;
  avatar: AvatarType;
  capital: number;
  position: number;
  isHost: boolean;
  status: 'playing' | 'waiting' | 'jail';
  taxExemptTurns: number;
  hasPaidTax: boolean;
}

export interface GameState {
  id: string;
  roomCode: string | null;
  gameType: GameType;
  players: Player[];
  currentPlayerIndex: number;
  turnTimer: number; // 60s limit
  interactionTimer: number; // 35s limit
  taxPool: number;
  mode: GameMode;
  sessionState: SessionState;
  levels?: Level[];
  auction?: {
    active: boolean;
    rolls: Record<string, number>;
  };
}

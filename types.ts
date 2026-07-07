
export enum Suit {
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
  Spades = '♠',
}

export enum Rank {
  Ace = 'A',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
}

export interface Card {
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
  id: string;
}

export enum Turn {
  Player = 'player',
  Computer = 'computer',
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export enum CardBackStyle {
  Classic = 'Classic',
  Uganda = 'Uganda',
  Zebra = 'Zebra',
  Leopard = 'Leopard',
  Kente = 'Kente',
}

export interface GameStatistics {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  longestStreak: number;
  totalMovesInWonGames: number;
  coins: number;
  unlockedItems: CardBackStyle[];
}

export interface DailyChallengeProgress {
  [date: string]: 'won' | 'played' | 'lost' | string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  time: number; // seconds
  moves: number;
  difficulty: Difficulty;
  date: string; // ISO Date
  isOnline?: boolean;
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHand: Card[]; // In multiplayer, this is HOST hand
  computerHand: Card[]; // In multiplayer, this is GUEST hand
  turn: Turn;
  activeSuit: Suit | null;
  drawPenalty: number;
  turnCount: number;
  winner?: 'player' | 'computer' | null;
}

// --- Multiplayer Types ---

export type NetworkRole = 'host' | 'guest' | 'none';

export interface NetworkPayload {
  type: 'SYNC' | 'MOVE' | 'RESTART' | 'EMOTE';
  state?: GameState;
  move?: {
    cardId?: string;
    action: 'play' | 'draw' | 'penalty';
    suit?: Suit;
  };
  emote?: string;
}

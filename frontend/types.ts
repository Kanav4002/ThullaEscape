export enum Suit {
  Spades = '♠',
  Hearts = '♥',
  Clubs = '♣',
  Diamonds = '♦',
}

export enum CardValue {
  Two = 2, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King, Ace
}

export interface Card {
  id: string;
  suit: Suit;
  value: number; // 2-14 (Ace is 14)
  display: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // URL
  cardCount: number;
  isBot: boolean;
  status: 'active' | 'waiting' | 'passed' | 'bhabhi' | 'finished' | 'left';
  isTurn: boolean;
  level: number;
  hand?: Card[]; // Only present for the current viewer's player
}

export interface GameState {
  roomCode: string;
  players: Player[];
  status: 'lobby' | 'playing' | 'ended';
  currentTurnPlayerId: string;
  trick: { card: Card; playedBy: string; rotation: number }[];
  deck: Card[];
  lastTrickWinner?: string;
  turnTimeLeft: number; // Seconds
  penaltyMessage?: string; // For Thulla alerts
}

export interface StatPoint {
  name: string;
  value: number;
}
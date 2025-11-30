import { Card, Suit, Player, StatPoint } from './types';

export const SUIT_COLORS = {
  [Suit.Spades]: 'text-slate-800',
  [Suit.Hearts]: 'text-rose-500',
  [Suit.Clubs]: 'text-slate-800',
  [Suit.Diamonds]: 'text-rose-500',
};

export const generateDeck = (): Card[] => {
  const suits = [Suit.Spades, Suit.Hearts, Suit.Clubs, Suit.Diamonds];
  const displays = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  let idCounter = 0;

  suits.forEach(suit => {
    displays.forEach((display, index) => {
      deck.push({
        id: `card-${idCounter++}`,
        suit,
        value: index + 2,
        display,
      });
    });
  });

  return deck.sort(() => Math.random() - 0.5); // Simple shuffle
};

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'You', avatar: 'https://picsum.photos/seed/user/100/100', cardCount: 0, isBot: false, status: 'active', isTurn: false, level: 12 },
  { id: 'p2', name: 'Aarav', avatar: 'https://picsum.photos/seed/aarav/100/100', cardCount: 13, isBot: true, status: 'active', isTurn: true, level: 8 },
  { id: 'p3', name: 'Ishita', avatar: 'https://picsum.photos/seed/ishita/100/100', cardCount: 13, isBot: true, status: 'active', isTurn: false, level: 15 },
  { id: 'p4', name: 'Rohan', avatar: 'https://picsum.photos/seed/rohan/100/100', cardCount: 13, isBot: true, status: 'active', isTurn: false, level: 5 },
  { id: 'p5', name: 'Priya', avatar: 'https://picsum.photos/seed/priya/100/100', cardCount: 13, isBot: true, status: 'active', isTurn: false, level: 19 },
  { id: 'p6', name: 'Vikram', avatar: 'https://picsum.photos/seed/vikram/100/100', cardCount: 13, isBot: true, status: 'active', isTurn: false, level: 11 },
  { id: 'p7', name: 'Neha', avatar: 'https://picsum.photos/seed/neha/100/100', cardCount: 13, isBot: true, status: 'active', isTurn: false, level: 7 },
  { id: 'p8', name: 'Karan', avatar: 'https://picsum.photos/seed/karan/100/100', cardCount: 13, isBot: true, status: 'active', isTurn: false, level: 14 },
];

export const WIN_RATE_DATA: StatPoint[] = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 65 },
  { name: 'Wed', value: 50 },
  { name: 'Thu', value: 85 },
  { name: 'Fri', value: 70 },
  { name: 'Sat', value: 90 },
  { name: 'Sun', value: 60 },
];

export const THULLA_STATS: StatPoint[] = [
  { name: 'Spades', value: 4 },
  { name: 'Hearts', value: 1 },
  { name: 'Clubs', value: 8 },
  { name: 'Diamonds', value: 2 },
];
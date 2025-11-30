import React from 'react';
import { Card as CardType, Suit } from '../types';
import { motion } from 'framer-motion';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  onClick?: () => void;
  className?: string;
  hidden?: boolean;
  small?: boolean;
}

const getCardCode = (card: CardType): string => {
  const suitCode = card.suit === Suit.Spades ? 'S' : 
                   card.suit === Suit.Hearts ? 'H' : 
                   card.suit === Suit.Diamonds ? 'D' : 'C';
  
  // DeckOfCardsAPI uses '0' for 10
  const valueCode = card.display === '10' ? '0' : card.display.charAt(0);
  return `${valueCode}${suitCode}`;
};

export const CardComponent: React.FC<CardProps> = ({ 
  card, 
  isPlayable = false, 
  onClick, 
  className = "",
  hidden = false,
  small = false
}) => {
  // Using a stable image for card back (Bicycle red back pattern)
  const CARD_BACK_URL = "https://i.pinimg.com/originals/10/80/a4/1080a4bd1a33cec92019fab5efb3995d.png";
  
  const cardCode = getCardCode(card);
  const cardImage = `https://deckofcardsapi.com/static/img/${cardCode}.png`;

  if (hidden) {
    return (
      <div 
        className={`relative rounded-lg shadow-md overflow-hidden ${small ? 'w-10 h-14' : 'w-24 h-[146px] md:w-32 md:h-44'} ${className}`}
      >
        <img src={CARD_BACK_URL} alt="Card Back" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      onClick={isPlayable ? onClick : undefined}
      whileHover={isPlayable ? { y: -20, scale: 1.1, zIndex: 100 } : {}}
      className={`
        relative 
        rounded-lg
        shadow-md 
        select-none
        overflow-hidden
        ${small ? 'w-12 h-16' : 'w-24 h-[146px] md:w-32 md:h-44'}
        ${isPlayable ? 'cursor-pointer hover:shadow-2xl hover:ring-2 hover:ring-yellow-400' : ''}
        ${className}
      `}
    >
      <img 
        src={cardImage} 
        alt={`${card.display} of ${card.suit}`} 
        className="w-full h-full object-contain bg-white"
        draggable={false}
      />
      
      {/* Optional: Subtle border for better definition against white backgrounds */}
      <div className="absolute inset-0 border border-black/10 rounded-lg pointer-events-none"></div>
    </motion.div>
  );
};
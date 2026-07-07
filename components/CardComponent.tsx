
import React from 'react';
import { Card, Suit, Rank, CardBackStyle } from '../types';

interface CardProps {
  card: Card;
  onClick?: () => void;
  isPlayable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  cardBackStyle?: CardBackStyle;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
}

const SuitIcon: React.FC<{ suit: Suit; size?: string }> = ({ suit, size }) => {
  const isRed = suit === Suit.Hearts || suit === Suit.Diamonds;
  const colorClass = isRed ? 'text-red-600' : 'text-black';
  // Adjust font size based on card size
  let fontSize = 'text-base sm:text-xl md:text-2xl';
  if (size === 'sm') fontSize = 'text-sm';
  if (size === 'md') fontSize = 'text-xl';
  if (size === 'lg') fontSize = 'text-3xl';

  return <span className={`${fontSize} ${colorClass}`}>{suit}</span>;
};

const CardComponent: React.FC<CardProps> = ({ 
  card, onClick, isPlayable, style, className, 
  cardBackStyle = CardBackStyle.Classic,
  size = 'responsive'
}) => {
  const { suit, rank, isFaceUp } = card;

  // Visual helpers for Power Cards
  const isJack = rank === Rank.Jack;
  const isTwo = rank === Rank.Two;
  const isEight = rank === Rank.Eight;

  let powerBadge = null;
  let borderClass = '';
  
  // Dimensions map
  const sizeClasses = {
      sm: 'w-12 h-16 text-xs rounded-md',
      md: 'w-16 h-24 text-base rounded-lg',
      lg: 'w-24 h-36 text-xl rounded-xl',
      responsive: 'w-14 h-20 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg sm:rounded-xl text-sm sm:text-lg md:text-xl'
  };

  const currentSizeClass = sizeClasses[size];

  if (isFaceUp) {
      if (isJack) {
          borderClass = 'ring-2 ring-purple-500';
          powerBadge = <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold z-10 shadow-sm border border-white">★</div>;
      } else if (isTwo) {
          borderClass = 'ring-2 ring-blue-500';
          powerBadge = <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold z-10 shadow-sm border border-white">+2</div>;
      } else if (isEight) {
          borderClass = 'ring-2 ring-orange-500';
          powerBadge = <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold z-10 shadow-sm border border-white">⊘</div>;
      }
  }

  const isRed = suit === Suit.Hearts || suit === Suit.Diamonds;
  const textColor = isRed ? 'text-red-600' : 'text-black';

  if (!isFaceUp) {
    const backClass = `card-back-${cardBackStyle.toLowerCase()}`;
    return (
      <div 
        style={style}
        onClick={onClick}
        className={`${currentSizeClass} shadow-md ${backClass} ${className || ''}`}
      />
    );
  }

  // Interaction styles for playable state (Glow, Lift, Ring)
  // We use !important on shadow to override any passed-in utility classes if necessary
  const interactionClasses = isPlayable
    ? 'cursor-pointer -translate-y-3 !shadow-[0_0_20px_rgba(250,204,21,0.6)] ring-2 ring-yellow-400 ring-offset-1 z-10 hover:-translate-y-5 hover:!shadow-[0_0_25px_rgba(250,204,21,0.8)]'
    : 'cursor-default opacity-100';

  return (
    <div
      style={style}
      onClick={onClick}
      className={`
        ${currentSizeClass} bg-white p-1.5 flex flex-col justify-between shadow-md relative select-none transition-all duration-300
        ${interactionClasses}
        ${borderClass} ${className || ''}
      `}
    >
      {powerBadge}
      <div className={`flex flex-col items-start ${textColor}`}>
        <div className="font-bold leading-none">{rank}</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <SuitIcon suit={suit} size={size} />
      </div>
      <div className={`flex flex-col items-end transform rotate-180 ${textColor}`}>
        <div className="font-bold leading-none">{rank}</div>
      </div>
    </div>
  );
};

export default CardComponent;

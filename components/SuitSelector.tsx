
import React from 'react';
import { Suit } from '../types';

interface SuitSelectorProps {
  onSelect: (suit: Suit) => void;
}

const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelect }) => {
  const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Select Suit</h2>
        <div className="grid grid-cols-2 gap-4">
          {suits.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`
                w-24 h-24 rounded-xl flex items-center justify-center text-6xl shadow-md transition-transform hover:scale-110 active:scale-95
                ${(suit === Suit.Hearts || suit === Suit.Diamonds) ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'bg-gray-50 text-black border-2 border-gray-200'}
              `}
            >
              {suit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuitSelector;

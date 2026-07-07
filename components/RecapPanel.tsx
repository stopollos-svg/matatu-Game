
import React from 'react';
import { Card, CardBackStyle } from '../types';
import CardComponent from './CardComponent';

interface RecapPanelProps {
  isOpen: boolean;
  onClose: () => void;
  discardPile: Card[];
  cardBack: CardBackStyle;
}

const RecapPanel: React.FC<RecapPanelProps> = ({ isOpen, onClose, discardPile, cardBack }) => {
  // Show last 20 cards, reversed so newest is top
  const recentCards = [...discardPile].reverse().slice(0, 20);

  return (
    <div 
        className={`fixed inset-y-0 right-0 w-80 bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-[60] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span>📜</span> Game Recap
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
            ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-gray-500 text-xs uppercase font-bold mb-2">Last Played Cards</p>
        
        {recentCards.length === 0 ? (
            <div className="text-gray-600 text-center py-8 italic">No cards played yet.</div>
        ) : (
            <div className="grid grid-cols-4 gap-2">
                {recentCards.map((card, idx) => (
                    <div key={`${card.id}-${idx}`} className="relative transform hover:scale-110 transition-transform origin-center z-0 hover:z-10">
                         <CardComponent 
                            card={{...card, isFaceUp: true}} 
                            cardBackStyle={cardBack}
                            style={{ width: '100%', height: 'auto', aspectRatio: '2.5/3.5' }} // Mini cards
                            className="text-[10px] !p-1 !rounded-md shadow-sm pointer-events-none"
                         />
                         {idx === 0 && (
                             <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                             </span>
                         )}
                    </div>
                ))}
            </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-800 border-t border-gray-700 text-center">
        <p className="text-gray-500 text-xs">Showing last 20 moves</p>
      </div>
    </div>
  );
};

export default RecapPanel;

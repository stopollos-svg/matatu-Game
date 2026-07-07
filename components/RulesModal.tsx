
import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-purple-700 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">How to Play Matatu</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <p className="text-gray-600 mb-6 text-lg">
                Welcome to <span className="font-bold text-purple-700">Matatu King Savannah Edition</span>. The goal is to be the first to play all your cards!
            </p>

            <div className="space-y-6">
                <div className="flex items-start">
                    <div className="bg-gray-100 p-3 rounded-lg mr-4 text-gray-700 font-bold text-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                        1
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Matching</h3>
                        <p className="text-gray-600">
                            Play a card that matches the <span className="font-bold">Suit</span> or <span className="font-bold">Rank</span> of the top card on the pile.
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="bg-purple-100 p-3 rounded-lg mr-4 text-purple-700 font-bold text-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                        J
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Jack is Wild</h3>
                        <p className="text-gray-600">
                            Play a Jack on ANY card to change the suit. You choose what suit comes next!
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4 text-blue-700 font-bold text-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                        2
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Two is "Kick Back"</h3>
                        <p className="text-gray-600">
                            Forces the next player to draw <span className="font-bold">2 cards</span>. 
                            <br/><span className="italic text-sm">Pro Tip: If you have a Two, you can play it on top to stack the penalty! (e.g., Draw 4, Draw 6...)</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4 text-orange-700 font-bold text-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                        8
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Eight is "Skip"</h3>
                        <p className="text-gray-600">
                            Playing an Eight skips the opponent's turn, allowing you to play again immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
             <button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
                Let's Play!
             </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;

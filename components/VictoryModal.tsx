
import React, { useState, useEffect } from 'react';

interface VictoryModalProps {
  moves: number;
  time: number;
  onNewGame: (playerName: string) => void;
  onHome: (playerName: string) => void;
  isDailyChallenge?: boolean;
  winner?: 'player' | 'computer' | null;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ moves, time, onNewGame, onHome, isDailyChallenge, winner }) => {
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    // Load last used name
    const savedName = localStorage.getItem('matatu-player-name');
    if (savedName) setPlayerName(savedName);
    else setPlayerName('Player 1');
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleAction = (action: 'new' | 'home') => {
      const nameToSave = playerName.trim() || 'Player 1';
      localStorage.setItem('matatu-player-name', nameToSave);
      
      if (action === 'new') onNewGame(nameToSave);
      else onHome(nameToSave);
  };

  const isPlayerWin = winner === 'player';
  
  // Custom text based on user request
  const title = isPlayerWin ? "VICTORY!" : "GAME OVER";
  const message = isPlayerWin ? "KING CONTROL THE SAVANAH" : "OPPONENT WINS";
  const emoji = isPlayerWin ? "🦁" : "💀";
  const titleColor = isPlayerWin ? "text-yellow-500" : "text-gray-800";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm text-center transform transition-all scale-100 opacity-100 animate-in fade-in zoom-in border-4 border-white ring-4 ring-black/20">
        <div className="flex justify-center mb-4">
             <span className="text-7xl animate-bounce">{emoji}</span>
        </div>
        <h2 className={`text-3xl font-black ${titleColor} mb-2 tracking-wide uppercase`}>
            {title}
        </h2>
        <p className="text-gray-900 font-bold mb-6 text-lg uppercase tracking-wider">
            {message}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 border border-gray-100">
          <div>
            <div className="text-3xl font-bold text-gray-800">{moves}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Moves</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{formatTime(time)}</div>
            <div className="text-xs text-gray-500 uppercase font-bold">Time</div>
          </div>
        </div>

        {isPlayerWin && (
            <div className="mb-6 text-left">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="playerName">
                    Enter Your Name
                </label>
                <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={12}
                    className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Your Name"
                />
            </div>
        )}

        <div className="flex gap-3">
            <button
            onClick={() => handleAction('home')}
            className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300 shadow-md active:transform active:scale-95"
            >
            Menu
            </button>
            <button
            onClick={() => handleAction('new')}
            className={`flex-1 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md active:transform active:scale-95 ${isPlayerWin ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
            {isPlayerWin ? 'Play Again' : 'Rematch'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryModal;

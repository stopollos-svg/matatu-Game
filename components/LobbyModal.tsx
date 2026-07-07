
import React, { useState } from 'react';

interface LobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHost: () => void;
  onJoin: (id: string) => void;
  onPlayAI: () => void;
  peerId: string | null;
  connectionStatus: string;
}

const LobbyModal: React.FC<LobbyModalProps> = ({ isOpen, onClose, onHost, onJoin, onPlayAI, peerId, connectionStatus }) => {
  const [joinId, setJoinId] = useState('');
  const [mode, setMode] = useState<'menu' | 'hosting' | 'joining'>('menu');

  if (!isOpen) return null;

  const handleCopy = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Online Multiplayer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {mode === 'menu' && (
          <div className="space-y-4">
            <button 
              onClick={() => { onHost(); setMode('hosting'); }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <span className="text-2xl">🏠</span>
              Host a Game
            </button>
            <button 
              onClick={() => setMode('joining')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
            >
              <span className="text-2xl">🔗</span>
              Join a Game
            </button>
            <p className="text-center text-gray-500 text-sm mt-4">Play directly with a friend via Peer-to-Peer connection.</p>
          </div>
        )}

        {mode === 'hosting' && (
          <div className="text-center space-y-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Your Game ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-gray-300 p-3 rounded text-lg font-mono font-bold tracking-wider select-all">
                  {peerId || 'Generating...'}
                </code>
                <button 
                  onClick={handleCopy}
                  className="bg-gray-200 hover:bg-gray-300 p-3 rounded transition-colors"
                  title="Copy ID"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-center animate-pulse text-purple-600">
              <div className="text-4xl mb-2">⏳</div>
              <p className="font-bold">{connectionStatus || "Waiting for opponent..."}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-3">Tired of waiting?</p>
                <button 
                    onClick={() => { onClose(); onPlayAI(); }}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg shadow transition-colors"
                >
                    🦁 Play vs AI
                </button>
            </div>
            
            <button onClick={() => setMode('menu')} className="text-gray-500 hover:underline text-sm">Back</button>
          </div>
        )}

        {mode === 'joining' && (
          <div className="space-y-6">
             <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Enter Friend's Game ID</label>
                <input
                    type="text"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-3 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 1234-abcd..."
                />
             </div>
             
             <button 
                onClick={() => onJoin(joinId)}
                disabled={!joinId || connectionStatus.includes('Connecting')}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
             >
                {connectionStatus === 'Connecting...' ? 'Connecting...' : 'Connect & Play'}
             </button>

             <div className="text-center">
                <button onClick={() => setMode('menu')} className="text-gray-500 hover:underline text-sm">Back</button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LobbyModal;

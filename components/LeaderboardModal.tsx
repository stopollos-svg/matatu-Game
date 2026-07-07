
import React, { useState } from 'react';
import { LeaderboardEntry, GameStatistics } from '../types';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  stats: GameStatistics;
  onClose: () => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ entries, stats, onClose }) => {
  const [tab, setTab] = useState<'local' | 'global'>('local');
  
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const losses = stats.gamesPlayed - stats.gamesWon;
  
  // Calculate best time from local entries
  const bestTimeSeconds = entries.length > 0 ? Math.min(...entries.map(e => e.time)) : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Mock global data for demonstration
  const globalEntries: LeaderboardEntry[] = [
      { id: 'g1', playerName: 'MatatuKing_UG', time: 45, moves: 12, difficulty: 'Hard', date: new Date().toISOString() } as any,
      { id: 'g2', playerName: 'KampalaQueen', time: 52, moves: 14, difficulty: 'Hard', date: new Date().toISOString() } as any,
      { id: 'g3', playerName: 'LionHeart', time: 58, moves: 15, difficulty: 'Medium', date: new Date().toISOString() } as any,
      { id: 'g4', playerName: 'SafariJoe', time: 65, moves: 18, difficulty: 'Hard', date: new Date().toISOString() } as any,
      { id: 'g5', playerName: 'BabePlayer1', time: 70, moves: 20, difficulty: 'Easy', date: new Date().toISOString() } as any,
  ];

  const displayEntries = tab === 'local' ? entries : globalEntries;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header with Stats Summary */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-6 shadow-lg relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🏆</div>
             <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center">
                    <span className="text-4xl mr-3 shadow-sm">📊</span>
                    <div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Leaderboard</h2>
                        <div className="text-yellow-200 text-xs font-bold uppercase tracking-widest opacity-80">Player Statistics</div>
                    </div>
                </div>
                <button onClick={onClose} className="text-white hover:text-yellow-200 bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-4 gap-3 relative z-10">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                    <div className="text-[10px] text-gray-300 uppercase font-bold tracking-wider mb-1">Games</div>
                    <div className="text-xl font-black">{stats.gamesPlayed}</div>
                </div>
                <div className="bg-green-900/40 backdrop-blur-sm rounded-lg p-3 text-center border border-green-500/30">
                    <div className="text-[10px] text-green-200 uppercase font-bold tracking-wider mb-1">Wins</div>
                    <div className="text-xl font-black text-green-300">{stats.gamesWon}</div>
                </div>
                <div className="bg-red-900/40 backdrop-blur-sm rounded-lg p-3 text-center border border-red-500/30">
                    <div className="text-[10px] text-red-200 uppercase font-bold tracking-wider mb-1">Losses</div>
                    <div className="text-xl font-black text-red-300">{losses}</div>
                </div>
                <div className="bg-blue-900/40 backdrop-blur-sm rounded-lg p-3 text-center border border-blue-500/30">
                    <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider mb-1">Best Time</div>
                    <div className="text-xl font-black text-blue-300">{bestTimeSeconds ? formatTime(bestTimeSeconds) : '--:--'}</div>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900 shrink-0">
            <button 
                onClick={() => setTab('local')}
                className={`flex-1 py-3 font-bold transition-colors text-sm uppercase tracking-wide ${tab === 'local' ? 'bg-gray-800 text-yellow-400 border-b-2 border-yellow-400' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}`}
            >
                Local History
            </button>
            <button 
                onClick={() => setTab('global')}
                className={`flex-1 py-3 font-bold transition-colors text-sm uppercase tracking-wide ${tab === 'global' ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}`}
            >
                Global (Online)
            </button>
        </div>
        
        {/* List */}
        <div className="flex-grow overflow-y-auto bg-gray-800 p-0">
            {displayEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <span className="text-5xl opacity-20">📜</span>
                    <p className="italic">No games recorded yet.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="text-gray-400 text-xs uppercase bg-gray-900/90 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th className="p-3 pl-4 font-bold tracking-wider">Rank</th>
                            <th className="p-3 font-bold tracking-wider">Player</th>
                            <th className="p-3 font-bold tracking-wider text-right">Time</th>
                            <th className="p-3 font-bold tracking-wider text-center">Moves</th>
                            <th className="p-3 pr-4 font-bold tracking-wider text-right">Diff</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-700/50">
                        {displayEntries.map((entry, index) => (
                            <tr 
                                key={entry.id} 
                                className={`
                                    hover:bg-white/5 transition-colors
                                    ${index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent' : ''}
                                `}
                            >
                                <td className="p-3 pl-4">
                                    {index === 0 && <span className="text-xl">🥇</span>}
                                    {index === 1 && <span className="text-xl">🥈</span>}
                                    {index === 2 && <span className="text-xl">🥉</span>}
                                    {index > 2 && <span className="font-mono text-gray-500 pl-1">#{index + 1}</span>}
                                </td>
                                <td className="p-3">
                                    <div className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-200'}`}>
                                        {entry.playerName}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-medium">{formatDate(entry.date)}</div>
                                </td>
                                <td className="p-3 text-right font-mono text-gray-300">{formatTime(entry.time)}</td>
                                <td className="p-3 text-center text-gray-400">{entry.moves}</td>
                                <td className="p-3 pr-4 text-right">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${
                                        entry.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                        entry.difficulty === 'Medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>
                                        {entry.difficulty?.charAt(0) || '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 text-center shrink-0">
             <button onClick={onClose} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors border border-gray-700">
                Close
             </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;


import React from 'react';
import { GameStatistics } from '../types';

interface StatsModalProps {
  stats: GameStatistics;
  onClose: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const avgMoves = stats.gamesWon > 0 ? Math.round(stats.totalMovesInWonGames / stats.gamesWon) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Statistics</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.gamesPlayed}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Played</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">{winRate}%</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Win Rate</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.currentStreak}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Current Streak</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.longestStreak}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">Max Streak</div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center mb-6">
          <span className="text-gray-700 font-medium">Average Moves per Win</span>
          <span className="text-xl font-bold text-blue-800">{avgMoves}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StatsModal;

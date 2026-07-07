
import React, { useState } from 'react';
import { Difficulty, CardBackStyle, GameStatistics } from '../types';
import PaymentModal from './PaymentModal';
import { SoundManager } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  cardBack: CardBackStyle;
  setCardBack: (style: CardBackStyle) => void;
  autoChangeBack: boolean;
  setAutoChangeBack: (auto: boolean) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  stats: GameStatistics;
  updateStats: (newStats: GameStatistics) => void;
  onShowToast?: (msg: string, emoji?: string) => void;
}

// Pricing config
const ITEM_PRICES: Record<string, number> = {
    [CardBackStyle.Classic]: 0,
    [CardBackStyle.Uganda]: 150,
    [CardBackStyle.Zebra]: 300,
    [CardBackStyle.Leopard]: 500,
    [CardBackStyle.Kente]: 800,
};

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, 
    difficulty, setDifficulty,
    cardBack, setCardBack,
    autoChangeBack, setAutoChangeBack,
    isMuted, setIsMuted,
    stats, updateStats,
    onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'shop'>('settings');
  const [showPayment, setShowPayment] = useState(false);

  if (!isOpen) return null;

  const handleBuy = (style: CardBackStyle) => {
      const price = ITEM_PRICES[style];
      if (stats.coins >= price) {
          updateStats({
              ...stats,
              coins: stats.coins - price,
              unlockedItems: [...stats.unlockedItems, style]
          });
          SoundManager.playFlipSound();
          onShowToast?.(`Unlocked ${style}!`, '🎉');
      } else {
          // Trigger buy coins flow
          setShowPayment(true);
      }
  };

  const handleEquip = (style: CardBackStyle) => {
      setCardBack(style);
      setAutoChangeBack(false);
      SoundManager.playFlipSound();
      onShowToast?.(`Equipped ${style}`, '✨');
  };

  const handleCoinPurchase = (amount: number) => {
      updateStats({
          ...stats,
          coins: stats.coins + amount
      });
      SoundManager.playWinSound(); // Celebration sound
      onShowToast?.(`Purchased ${amount} Coins!`, '💰');
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header with Tabs */}
        <div className="bg-gray-800 flex justify-between items-center shrink-0">
            <div className="flex">
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'settings' ? 'bg-gray-700 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                >
                    Settings
                </button>
                <button 
                    onClick={() => setActiveTab('shop')}
                    className={`px-6 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'shop' ? 'bg-gray-700 text-white border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}
                >
                    Shop
                </button>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white px-4">✕</button>
        </div>

        {/* Currency Display */}
        <div className="bg-gray-900 py-2 px-4 flex justify-between items-center shadow-inner">
            <span className="text-gray-400 text-xs uppercase font-bold">My Wallet</span>
            <div className="flex items-center text-yellow-400 font-bold">
                <span className="mr-2 text-xl">🪙</span>
                <span className="text-lg">{stats.coins.toLocaleString()}</span>
                <button 
                    onClick={() => setShowPayment(true)}
                    className="ml-3 bg-green-600 hover:bg-green-500 text-white text-xs px-2 py-1 rounded shadow"
                >
                    + ADD
                </button>
            </div>
        </div>
        
        <div className="p-6 overflow-y-auto bg-gray-50 flex-grow">
            
            {activeTab === 'settings' && (
                <>
                    {/* AI Difficulty */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">AI Difficulty</h3>
                        <div className="space-y-2">
                            {Object.values(Difficulty).map((level) => (
                                <label 
                                    key={level} 
                                    className={`
                                        flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all bg-white
                                        ${difficulty === level ? 'border-purple-600 bg-purple-50 shadow-sm' : 'border-gray-200 hover:border-purple-300'}
                                    `}
                                >
                                    <input 
                                        type="radio" 
                                        name="difficulty" 
                                        value={level} 
                                        checked={difficulty === level} 
                                        onChange={() => setDifficulty(level)}
                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div className="ml-3">
                                        <span className="block font-bold text-gray-800">{level}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Preferences */}
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Preferences</h3>
                    
                    <label className="flex items-center mb-4 cursor-pointer bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={!isMuted} 
                            onChange={(e) => setIsMuted(!e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 font-medium flex items-center gap-2">
                            <span>{isMuted ? '🔇' : '🔊'}</span>
                            Enable Sound Effects
                        </span>
                    </label>

                    <label className="flex items-center mb-4 cursor-pointer bg-white p-3 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={autoChangeBack} 
                            onChange={(e) => setAutoChangeBack(e.target.checked)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="ml-3 text-gray-700 font-medium">Auto-Change Card Style</span>
                    </label>
                </>
            )}

            {activeTab === 'shop' && (
                <div className="space-y-4">
                     {Object.values(CardBackStyle).map((style) => {
                        const isUnlocked = stats.unlockedItems.includes(style);
                        const isSelected = cardBack === style;
                        const price = ITEM_PRICES[style];

                        return (
                            <div key={style} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-16 rounded shadow-sm card-back-${style.toLowerCase()} ${isSelected ? 'ring-2 ring-green-500' : ''}`}></div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{style}</h4>
                                        {!isUnlocked && (
                                            <div className="text-yellow-600 font-bold text-sm flex items-center">
                                                🪙 {price}
                                            </div>
                                        )}
                                        {isUnlocked && <span className="text-green-600 text-xs font-bold uppercase">Owned</span>}
                                    </div>
                                </div>

                                {isUnlocked ? (
                                    <button
                                        onClick={() => handleEquip(style)}
                                        disabled={isSelected}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                            isSelected 
                                            ? 'bg-gray-100 text-gray-400 cursor-default' 
                                            : 'bg-gray-800 text-white hover:bg-gray-700 shadow-md'
                                        }`}
                                    >
                                        {isSelected ? 'Active' : 'Equip'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleBuy(style)}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md flex items-center ${
                                            stats.coins >= price
                                            ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {stats.coins >= price ? 'Unlock' : 'Need Coins'}
                                    </button>
                                )}
                            </div>
                        );
                     })}
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
             <button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors">
                Close
             </button>
        </div>
      </div>
    </div>
    
    <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        onSuccess={handleCoinPurchase} 
    />
    </>
  );
};

export default SettingsModal;
    
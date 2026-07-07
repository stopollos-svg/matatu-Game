
import React, { useState, useEffect } from 'react';
import { DailyChallengeProgress } from '../types';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayDate: (date: Date) => void;
  progress: DailyChallengeProgress;
}

const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ isOpen, onClose, onPlayDate, progress }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    // Reset selection to today when opened
    if (isOpen) {
        const now = new Date();
        setSelectedDate(now);
        setViewMonth(now);
        setCurrentDate(now);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const daysArray = [];
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }

  const handlePrevMonth = () => {
    setViewMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    if (nextMonth <= new Date()) { // Prevent going to future months beyond current
         setViewMonth(nextMonth);
    }
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
  };
  
  const isFuture = (date: Date) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      return date > today;
  }

  const getStatus = (date: Date) => {
      const key = formatDateKey(date);
      if (progress[key] === 'won') return 'won';
      if (isSameDay(date, new Date())) return 'today';
      if (isFuture(date)) return 'future';
      return 'past';
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Stats
  const totalWon = Object.values(progress).filter(s => s === 'won').length;
  const wonThisMonth = Object.keys(progress).filter(key => {
      const d = new Date(key);
      return d.getMonth() === month && d.getFullYear() === year && progress[key] === 'won';
  }).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#5d4037] p-4 flex items-center justify-between border-b border-gray-700">
           <button onClick={onClose} className="p-2 bg-green-600 rounded-full hover:bg-green-700">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
             </svg>
           </button>
           <h2 className="text-xl font-bold uppercase tracking-wider text-[#ffd700]">Daily Challenge</h2>
           <div className="w-9"></div> {/* Spacer */}
        </div>

        {/* Calendar Nav */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
            <button onClick={handlePrevMonth} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="text-lg font-semibold">{monthNames[month]} {year}</div>
            <button onClick={handleNextMonth} className={`text-gray-400 hover:text-white ${viewMonth.getMonth() === currentDate.getMonth() && viewMonth.getFullYear() === currentDate.getFullYear() ? 'opacity-30 cursor-default' : ''}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center py-2 bg-gray-800 text-xs font-bold text-gray-500 uppercase">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 p-2 bg-gray-800 flex-grow overflow-y-auto">
            {daysArray.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="aspect-square"></div>;
                
                const status = getStatus(date);
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isSameDay(date, currentDate);
                
                let bgClass = "bg-[#d4a373]"; // default card back colorish
                let content = <span className="text-gray-900 font-bold">{date.getDate()}</span>;

                if (status === 'future') {
                    bgClass = "bg-gray-700 opacity-50 cursor-not-allowed";
                    content = <span className="text-gray-500 font-bold">{date.getDate()}</span>;
                } else if (status === 'won') {
                    bgClass = "bg-[#ffd700] border-2 border-[#b8860b]";
                    content = (
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-[#b8860b] mb-[-2px]">{date.getDate()}</span>
                            <span className="text-xl">👑</span>
                        </div>
                    );
                } else if (isCurrentDay) {
                    bgClass = "bg-green-500 animate-pulse";
                    content = <span className="text-white font-bold">{date.getDate()}</span>;
                }

                return (
                    <button 
                        key={index}
                        onClick={() => status !== 'future' && setSelectedDate(date)}
                        className={`aspect-square rounded-lg flex items-center justify-center relative transition-all
                            ${bgClass}
                            ${isSelected ? 'ring-4 ring-blue-500 z-10 scale-110' : ''}
                        `}
                        disabled={status === 'future'}
                    >
                        {content}
                    </button>
                );
            })}
        </div>

        {/* Stats Area */}
        <div className="bg-gray-900 py-4 px-6 flex justify-around border-t border-gray-700">
             <div className="flex flex-col items-center">
                 <div className="flex items-center text-[#ffd700]">
                    <span className="text-2xl mr-2">👑</span>
                    <span className="text-xl font-bold">All Time: {totalWon}</span>
                 </div>
             </div>
             <div className="flex flex-col items-center">
                 <div className="flex items-center text-[#ffd700]">
                    <span className="text-2xl mr-2">👑</span>
                    <span className="text-xl font-bold">This Month: {wonThisMonth}</span>
                 </div>
             </div>
        </div>

        {/* Footer Play Button */}
        <div className="p-6 bg-gray-900">
            <button 
                onClick={() => onPlayDate(selectedDate)}
                className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white font-bold text-xl py-3 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
            >
                PLAY
            </button>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengeModal;

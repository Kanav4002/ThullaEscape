import React from 'react';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  position: 'top' | 'left' | 'right' | 'bottom' | 'user';
  compact?: boolean;
  timeLeft?: number; // Total turn time
  currentTime?: number; // Current remaining time
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, position, compact = false, timeLeft = 15, currentTime = 0 }) => {
  const isTurn = player.isTurn;
  
  // Calculate timer progress
  const progress = isTurn ? (currentTime / timeLeft) * 100 : 0;
  const strokeColor = currentTime < 5 ? '#EF4444' : '#EAB308'; // Red if < 5s, else Yellow

  return (
    <div className={`flex flex-col items-center gap-1 relative group transition-all duration-300 ${isTurn ? 'scale-105 z-10' : 'opacity-90'}`}>
      
      {/* Avatar Container */}
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
        {/* Turn Timer Ring */}
        {isTurn && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform scale-110">
             <circle cx="50%" cy="50%" r="46%" fill="none" stroke="#E2E8F0" strokeWidth="3" />
             <circle 
               cx="50%" cy="50%" r="46%" 
               fill="none" 
               stroke={strokeColor} 
               strokeWidth="3"
               strokeDasharray="100 100" // Approximation for percentage
               strokeDashoffset={100 - progress}
               pathLength="100"
               className="transition-all duration-1000 ease-linear"
             />
          </svg>
        )}

        {/* Tactical Frame */}
        <div className={`relative w-full h-full p-1 rounded-full border-2 ${isTurn ? 'border-yellow-400 bg-yellow-50' : 'border-slate-300 bg-white'}`}>
          <img 
            src={player.avatar} 
            alt={player.name}
            className="w-full h-full rounded-full object-cover"
          />
          {player.status === 'bhabhi' && (
             <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">BHABHI</span>
             </div>
          )}
        </div>

        {/* Level Badge */}
        <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded clip-slanted-sm border border-slate-600">
          Lv.{player.level}
        </div>
      </div>

      {/* Name Tag */}
      {!compact && (
        <div className="flex flex-col items-center">
          <div className={`
            px-3 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wide
            ${isTurn ? 'bg-yellow-400 text-yellow-900 clip-slanted-sm' : 'bg-white text-slate-600 border border-slate-200'}
          `}>
            {player.name}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">{player.cardCount} CARDS</span>
        </div>
      )}
    </div>
  );
};
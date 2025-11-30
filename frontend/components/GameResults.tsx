import React from 'react';
import { Player } from '../types';
import { Trophy, Medal, Skull, Home, RotateCcw, Crown } from 'lucide-react';

interface GameResultsProps {
  players: Player[];
  finishOrder: string[];
  currentUserId: string | null;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({
  players,
  finishOrder,
  currentUserId,
  onPlayAgain,
  onBackToLobby,
}) => {
  // Sort players by finish order
  const sortedPlayers = finishOrder.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  
  // Add any players not in finish order (shouldn't happen but safety)
  players.forEach(p => {
    if (!sortedPlayers.find(sp => sp.id === p.id)) {
      sortedPlayers.push(p);
    }
  });

  const getPositionStyle = (index: number, totalPlayers: number, status?: string) => {
    const isLast = index === totalPlayers - 1;
    
    if (status === 'bhabhi' || isLast) {
      return {
        bg: 'bg-gradient-to-br from-red-600 to-red-800',
        border: 'border-red-400',
        icon: <Skull className="text-red-200" size={28} />,
        label: 'BHABHI',
        emoji: '💀',
        textColor: 'text-white',
        scale: 'scale-100',
      };
    }
    
    switch (index) {
      case 0:
        return {
          bg: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500',
          border: 'border-yellow-300',
          icon: <Crown className="text-yellow-800" size={32} />,
          label: '1ST',
          emoji: '🏆',
          textColor: 'text-yellow-900',
          scale: 'scale-105',
        };
      case 1:
        return {
          bg: 'bg-gradient-to-br from-slate-300 to-slate-400',
          border: 'border-slate-200',
          icon: <Medal className="text-slate-700" size={26} />,
          label: '2ND',
          emoji: '🥈',
          textColor: 'text-slate-800',
          scale: 'scale-100',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-amber-500 to-amber-700',
          border: 'border-amber-400',
          icon: <Medal className="text-amber-200" size={26} />,
          label: '3RD',
          emoji: '🥉',
          textColor: 'text-amber-100',
          scale: 'scale-100',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-500 to-slate-600',
          border: 'border-slate-400',
          icon: null,
          label: `${index + 1}TH`,
          emoji: '',
          textColor: 'text-slate-100',
          scale: 'scale-100',
        };
    }
  };

  const currentPosition = finishOrder.indexOf(currentUserId || '');
  const isWinner = currentPosition === 0;
  const isBhabhi = currentPosition === sortedPlayers.length - 1;

  // Card suits for decoration
  const suits = ['♠', '♥', '♦', '♣'];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      {/* Background Image - Casino celebration */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=3840')`,
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/85"></div>
      
      {/* Decorative floating cards */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-6xl animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              color: i % 2 === 0 ? '#22d3ee' : '#10b981',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          >
            {suits[i % 4]}
          </div>
        ))}
      </div>

      {/* Confetti effect for winner */}
      {isWinner && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-xl w-full mx-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-7xl mb-4">
            {isWinner ? '🎉' : isBhabhi ? '💀' : '🃏'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
            {isWinner ? 'YOU ESCAPED!' : isBhabhi ? 'YOU ARE BHABHI!' : 'GAME OVER'}
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            {isWinner
              ? 'First to finish all cards!'
              : isBhabhi
              ? 'Last one standing... better luck next time!'
              : `You finished in ${currentPosition + 1}${['st', 'nd', 'rd'][currentPosition] || 'th'} place`}
          </p>
        </div>

        {/* Player Cards - Podium Style */}
        <div className="space-y-3 mb-8">
          {sortedPlayers.map((player, index) => {
            const style = getPositionStyle(index, sortedPlayers.length, player.status);
            const isCurrentUser = player.id === currentUserId;
            
            return (
              <div
                key={player.id}
                className={`${style.bg} ${style.scale} rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 border-2 ${style.border} shadow-xl ${
                  isCurrentUser ? 'ring-4 ring-white/40' : ''
                }`}
              >
                {/* Position Badge */}
                <div className={`w-14 h-14 rounded-xl ${index === sortedPlayers.length - 1 ? 'bg-red-900/50' : 'bg-black/20'} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl">{style.emoji || style.label}</span>
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 flex-shrink-0 shadow-lg">
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Name & Level */}
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-lg ${style.textColor} truncate flex items-center gap-2`}>
                    {player.name}
                    {isCurrentUser && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">YOU</span>}
                  </div>
                  <div className={`text-sm ${style.textColor} opacity-70`}>
                    Level {player.level || 1}
                  </div>
                </div>
                
                {/* Position Icon */}
                <div className="flex-shrink-0">
                  {style.icon}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-yellow-500/30"
          >
            <RotateCcw size={20} />
            Play Again
          </button>
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            <Home size={20} />
            Leave Room
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(10deg);
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

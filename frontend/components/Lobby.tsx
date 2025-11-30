import React, { useState } from 'react';
import { Player } from '../types';
import { Copy, Play, Shield, Zap, Check, Users, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface LobbyProps {
  roomCode: string;
  players: Player[];
  onStart: () => void;
  onOpenRules: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ roomCode, players, onStart, onOpenRules }) => {
  const [copied, setCopied] = useState(false);
  const player = players[0]; // First player in room
  const hasRoom = roomCode && roomCode.length > 0;
  const canStart = players.length >= 3;

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex flex-col items-center justify-center">
      
      {/* Fullscreen Background - Playing cards on green felt */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&q=80&w=3840')`,
        }}
      />
      {/* Dark overlay for card game feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/50 to-slate-900/70"></div>
      
      {/* Decorative card suits floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {['♠', '♥', '♦', '♣'].map((suit, i) => (
          <div
            key={i}
            className="absolute text-white text-8xl font-bold animate-float"
            style={{
              left: `${15 + i * 25}%`,
              top: `${20 + (i % 2) * 40}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {suit}
          </div>
        ))}
      </div>
      
      {/* Center Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-lg px-4"
      >
        
        {/* Logo & Tagline */}
        <div className="text-center space-y-3">
           <motion.div 
             initial={{ scale: 0.8 }} 
             animate={{ scale: 1 }}
             className="flex items-center justify-center gap-3 text-cyan-400 font-black tracking-widest text-sm uppercase bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full w-fit mx-auto border border-cyan-400/40"
           >
              <Zap size={16} fill="currentColor" /> Thulla Escape
           </motion.div>
           <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-none">
              THULLA<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">ESCAPE</span>
           </h1>
           <p className="text-cyan-300 text-base font-bold italic tracking-wide drop-shadow-lg">
             ♠ ♥ Don't be the last one holding cards ♦ ♣
           </p>
        </div>

        {/* Main Card - Only show when room exists */}
        {hasRoom ? (
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-6 rounded-2xl shadow-2xl w-full">
             {/* Player info */}
             {player && (
               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                  <div className="relative w-16 h-16 rounded-full border-3 border-yellow-400 bg-slate-700 overflow-hidden shadow-lg">
                     <img src={player.avatar} alt="Me" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                     <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white uppercase">{player.name}</h2>
                        <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded">Lv.{player.level || 1}</span>
                     </div>
                     <div className="flex items-center gap-3 mt-1 text-slate-400 font-medium text-xs">
                        <span className="flex items-center gap-1"><Shield size={12}/> Room Leader</span>
                     </div>
                  </div>
               </div>
             )}

             {/* Players in room */}
             <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Players in Room</span>
                  <span className="text-xs font-bold text-yellow-400">{players.length}/8</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {players.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded-lg">
                      <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full border border-slate-600" />
                      <span className="text-white text-sm font-medium">{p.name}</span>
                      {i === 0 && <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-bold">HOST</span>}
                    </div>
                  ))}
                  {players.length < 3 && (
                    <div className="flex items-center gap-2 bg-slate-700/30 border border-dashed border-slate-600 px-3 py-2 rounded-lg text-slate-500 text-sm">
                      <Users size={16} /> Waiting for {3 - players.length} more...
                    </div>
                  )}
                </div>
             </div>

             {/* Room Code */}
             <div className="bg-slate-900/50 rounded-xl p-4 flex items-center justify-between border border-slate-700 mb-6">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room Code</span>
                   <span className="text-2xl font-mono font-black text-white tracking-[0.2em]">{roomCode}</span>
                </div>
                <button 
                   onClick={handleCopy}
                   className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                >
                   {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
             </div>
             
             {/* Action Buttons */}
             <div className="space-y-3">
               <button 
                  onClick={onStart}
                  disabled={!canStart}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 font-black text-xl py-4 flex items-center justify-center gap-2 rounded-xl hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
               >
                  {canStart ? 'START GAME' : `NEED ${3 - players.length} MORE PLAYERS`}
                  {canStart && <Play size={24} fill="currentColor" />}
               </button>
               
               <button 
                  onClick={onOpenRules}
                  className="w-full bg-slate-700/50 font-bold text-sm py-3 text-slate-300 flex items-center justify-center gap-2 rounded-xl hover:bg-slate-700 transition-all border border-slate-600"
               >
                  <BookOpen size={16} /> HOW TO PLAY
               </button>
             </div>
          </div>
        ) : (
          /* No room - show welcome message */
          <div className="bg-white/15 backdrop-blur-2xl border border-white/30 p-10 rounded-3xl shadow-2xl w-full text-center relative overflow-hidden">
            {/* Glassy shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="text-7xl mb-5">🃏</div>
              <h2 className="text-3xl font-black text-white mb-3 drop-shadow-lg">Ready to Play?</h2>
              <p className="text-white/80 mb-8 text-lg">Create a new room or join an existing one using the buttons above.</p>
              <button 
                onClick={onOpenRules}
                className="bg-white/20 backdrop-blur font-bold text-base py-4 px-8 text-white flex items-center justify-center gap-3 rounded-xl hover:bg-white/30 transition-all border border-white/30 mx-auto shadow-lg"
              >
                <BookOpen size={20} /> Learn How to Play
              </button>
            </div>
          </div>
        )}

      </motion.div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center z-10">
         <p className="text-xs font-mono font-black uppercase tracking-[0.3em] text-white/70">Thulla Escape • v1.0</p>
      </div>
      
      {/* Float animation style */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
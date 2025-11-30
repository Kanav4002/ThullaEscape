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
  const player = players[0]; // Assuming P1 is the user

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">
      
      {/* 1. Fullscreen Background Image */}
      <img 
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=3400"
        className="absolute inset-0 w-full h-full object-cover z-0"
        alt="Landscape"
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/40 z-0 backdrop-blur-[2px]"></div>
      
      {/* 2. Perfect Center Stack */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-4"
        style={{ marginTop: '-5vh' }} // Visual adjustment to feel optical center
      >
        
        {/* Logo & Tagline */}
        <div className="text-center space-y-2">
           <motion.div 
             initial={{ scale: 0.8 }} 
             animate={{ scale: 1 }}
             className="flex items-center justify-center gap-3 text-purple-700 font-black tracking-widest text-sm uppercase bg-white/80 backdrop-blur px-4 py-1 rounded-full w-fit mx-auto shadow-sm"
           >
              <Zap size={16} fill="currentColor" /> Thulla Escape
           </motion.div>
           <h1 className="text-6xl md:text-7xl font-black text-slate-900 uppercase italic tracking-tighter drop-shadow-sm leading-none">
              ESCAPE<br/>VELOCITY
           </h1>
        </div>

        {/* Character/Stats Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-6 rounded-2xl shadow-2xl w-full clip-slanted">
           <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20 rounded-full border-4 border-yellow-400 bg-slate-200 overflow-hidden shadow-md">
                 <img src={player.avatar} alt="Me" className="w-full h-full object-cover" />
              </div>
              <div>
                 <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-800 uppercase">{player.name}</h2>
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded clip-slanted-sm">Lv.{player.level}</span>
                 </div>
                 <div className="flex items-center gap-3 mt-1 text-slate-600 font-bold text-xs">
                    <span className="flex items-center gap-1"><Shield size={12}/> Win Rate 52%</span>
                    <span className="flex items-center gap-1"><Users size={12}/> 128 Games</span>
                 </div>
              </div>
           </div>

           {/* Room Code */}
           <div className="bg-white/50 rounded-lg p-3 flex items-center justify-between border border-white/60 mb-6">
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room Code</span>
                 <span className="text-xl font-mono font-black text-slate-800 tracking-wider">{roomCode}</span>
              </div>
              <button 
                 onClick={handleCopy}
                 className="p-2 hover:bg-white rounded-md transition-colors text-slate-600"
              >
                 {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              </button>
           </div>
           
           {/* Action Buttons */}
           <div className="space-y-3">
             <button 
                onClick={onStart}
                className="w-full btn-genshin-yellow font-black text-xl py-4 flex items-center justify-center gap-2 clip-slanted-sm hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-yellow-500/30 group"
             >
                START GAME 
                <Play size={24} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
             </button>
             
             <button 
                onClick={onOpenRules}
                className="w-full bg-white font-bold text-sm py-3 text-slate-600 flex items-center justify-center gap-2 clip-slanted-sm hover:bg-slate-50 transition-all border border-slate-200"
             >
                <BookOpen size={16} /> HOW TO PLAY
             </button>
           </div>
        </div>

      </motion.div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-8 text-center z-10 opacity-50">
         <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-slate-800">System Ready • v1.0.4</p>
      </div>
    </div>
  );
};
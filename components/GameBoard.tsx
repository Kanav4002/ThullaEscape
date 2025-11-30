import React, { useState } from 'react';
import { GameState, Card as CardType } from '../types';
import { CardComponent } from './CardComponent';
import { PlayerAvatar } from './PlayerAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Settings, Copy, Check, LogOut, Volume2 } from 'lucide-react';

interface GameBoardProps {
  gameState: GameState;
  onPlayCard: (card: CardType) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onPlayCard }) => {
  const user = gameState.players.find(p => p.id === 'p1');
  const opponents = gameState.players.filter(p => p.id !== 'p1');
  const [userHand, setUserHand] = useState<CardType[]>(gameState.deck.slice(0, 13).sort((a,b) => a.suit.localeCompare(b.suit)));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync hand removal (mock)
  const handleCardClick = (card: CardType) => {
    if (gameState.currentTurnPlayerId !== 'p1') return; // Prevent playing out of turn
    onPlayCard(card);
    setUserHand(prev => prev.filter(c => c.id !== card.id));
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-between py-4 md:py-6 select-none bg-[#F2F3F5] genshin-grid overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/20 to-white/50"></div>

      {/* FIXED SETTINGS ICON (Top Right) */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
         {/* Room Code Badge */}
         <div 
           className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-white cursor-pointer hover:bg-white transition-colors group"
           onClick={handleCopyCode}
         >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CODE:</span>
            <span className="font-mono font-bold text-slate-800">{gameState.roomCode}</span>
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400 group-hover:text-blue-500" />}
         </div>

         <div className="relative">
            <button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center backdrop-blur shadow-sm border transition-all duration-300
                ${settingsOpen ? 'bg-yellow-400 border-yellow-500 text-yellow-900 rotate-90' : 'bg-white/80 border-white text-slate-600 hover:text-blue-500 hover:shadow-md'}
              `}
            >
              <Settings size={20} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {settingsOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className="absolute top-14 right-0 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/50 p-2 flex flex-col gap-1 origin-top-right clip-slanted-sm"
                >
                  <button className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <Volume2 size={16} /> Sound: ON
                  </button>
                  <button onClick={handleCopyCode} className="flex md:hidden items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <Copy size={16} /> Copy Code
                  </button>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <button className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <LogOut size={16} /> Leave Game
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
         </div>
      </div>

      {/* Thulla / Penalty Alert Overlay */}
      <AnimatePresence>
        {gameState.penaltyMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-8 py-4 rounded-lg clip-slanted shadow-2xl backdrop-blur-md flex items-center gap-4 border border-red-400"
          >
            <AlertTriangle size={32} className="text-yellow-300 animate-pulse" />
            <div>
              <h3 className="font-black text-xl italic uppercase">PENALTY DETECTED</h3>
              <p className="font-mono text-sm">{gameState.penaltyMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar: Opponents */}
      <div className="w-full max-w-7xl flex justify-center items-start relative h-32 md:h-40 px-4 z-20 mt-4 md:mt-0">
        <div className="flex justify-center items-center gap-3 md:gap-8 lg:gap-12 flex-wrap">
          {opponents.map((player) => (
            <PlayerAvatar 
              key={player.id} 
              player={player} 
              position="top" 
              timeLeft={15} 
              currentTime={gameState.turnTimeLeft}
            />
          ))}
        </div>
      </div>

      {/* Center: Trick Pile */}
      <div className="flex-1 w-full flex items-center justify-center relative z-10">
        {/* Decorative Rings */}
        <div className="absolute w-[280px] h-[280px] md:w-[450px] md:h-[450px] border border-slate-300 rounded-full opacity-30 pointer-events-none"></div>
        <div className="absolute w-[230px] h-[230px] md:w-[350px] md:h-[350px] border border-dashed border-slate-400 rounded-full opacity-20 pointer-events-none animate-spin-slow"></div>
        
        {/* Cards */}
        <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
          {gameState.trick.length === 0 && (
            <div className="text-slate-400 font-bold tracking-widest text-xs uppercase flex flex-col items-center gap-2">
              <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
              WAITING FOR LEAD
            </div>
          )}
          <AnimatePresence>
          {gameState.trick.map((play, idx) => (
             <motion.div 
               key={play.card.id}
               initial={{ opacity: 0, scale: 1.5, y: -100 }}
               animate={{ opacity: 1, scale: 1, y: 0, rotate: play.rotation }}
               exit={{ opacity: 0, scale: 0.5, x: 200 }} // Thulla animation direction
               className="absolute shadow-2xl"
               style={{ zIndex: idx }}
             >
               <CardComponent card={play.card} />
             </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom: User Hand */}
      <div className="w-full flex flex-col items-center justify-end z-30 pb-4 md:pb-6">
        
        {/* Status Bar */}
        <div className="flex items-center gap-4 mb-2 md:mb-6">
           {gameState.currentTurnPlayerId === 'p1' ? (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-yellow-400 text-yellow-900 px-6 py-2 clip-slanted-sm font-black tracking-widest flex items-center gap-2 shadow-lg shadow-yellow-400/20"
             >
               <Clock size={18} /> YOUR TURN ({gameState.turnTimeLeft}s)
             </motion.div>
           ) : (
             <div className="bg-slate-200 text-slate-500 px-4 py-1 clip-slanted-sm text-xs font-bold tracking-wider flex items-center gap-2">
               <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
               OPPONENT THINKING...
             </div>
           )}
        </div>

        {/* Hand Cards - Improved Fanning for image based cards */}
        <div className="relative h-40 md:h-48 w-full max-w-5xl flex justify-center items-end perspective-[1000px] px-4">
          <AnimatePresence>
          {userHand.map((card, index) => {
            const total = userHand.length;
            const center = (total - 1) / 2;
            const rotate = (index - center) * 3; // Reduced rotation for cleaner look
            const translateY = Math.abs(index - center) * 4;
            const xOffset = (index - center) * -30; // Closer spacing with negative margin logic via CSS

            return (
              <motion.div 
                key={card.id}
                layoutId={card.id}
                initial={{ y: 100 }}
                animate={{ y: translateY, rotate: rotate }}
                exit={{ y: 100, opacity: 0 }}
                className="hover:z-50 origin-bottom transition-all duration-200 -ml-12 first:ml-0 md:-ml-16 cursor-pointer"
                style={{ marginBottom: translateY * -0.5 }} 
              >
                <CardComponent 
                  card={card} 
                  isPlayable={gameState.currentTurnPlayerId === 'p1'}
                  onClick={() => handleCardClick(card)}
                />
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
        
        {/* User Info Capsule - Centered on Mobile, Left on Desktop */}
        <div className="absolute bottom-4 left-4 hidden md:flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-2 rounded-lg border border-white shadow-sm hover:scale-105 transition-transform cursor-default">
           <div className="w-10 h-10 rounded-full border-2 border-yellow-400 overflow-hidden">
              <img src={user?.avatar} alt="Me" className="w-full h-full object-cover" />
           </div>
           <div>
              <div className="text-xs font-black text-slate-800 uppercase">YOU</div>
              <div className="text-[10px] font-mono text-slate-500">LV.{user?.level}</div>
           </div>
        </div>
      </div>
    </div>
  );
};
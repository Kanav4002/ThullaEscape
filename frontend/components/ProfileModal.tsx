import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { X, RefreshCw, Save, User, Shield } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | undefined;
  onUpdate: (name: string, avatar: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, player, onUpdate }) => {
  const [name, setName] = useState(player?.name || '');
  const [tempAvatar, setTempAvatar] = useState(player?.avatar || '');

  // Update state when player changes
  useEffect(() => {
    if (player) {
      setName(player.name);
      setTempAvatar(player.avatar);
    }
  }, [player]);

  if (!isOpen || !player) return null;

  const handleRandomizeAvatar = () => {
    const seed = Math.floor(Math.random() * 1000);
    setTempAvatar(`https://picsum.photos/seed/${seed}/200/200`);
  };

  const handleSave = () => {
    onUpdate(name, tempAvatar);
    onClose();
  }; // actual API call is wired in App via onUpdate

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#F2F3F5] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/50 clip-slanted">
        {/* Header */}
        <div className="bg-white/50 p-6 flex justify-between items-center border-b border-slate-200">
           <div className="flex items-center gap-2 text-slate-800 font-black italic uppercase text-xl">
             <User className="text-yellow-500" /> Agent Profile
           </div>
           <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center gap-6">
           {/* Avatar Section */}
           <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg bg-slate-300">
                <img src={tempAvatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={handleRandomizeAvatar}
                className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full shadow-md hover:bg-slate-700 transition-colors"
                title="Randomize Avatar"
              >
                <RefreshCw size={16} />
              </button>
           </div>

           {/* Stats Row */}
           <div className="flex items-center gap-4 w-full justify-center">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Level</span>
                 <span className="text-xl font-black text-slate-800">{player.level}</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Win Rate</span>
                 <span className="text-xl font-black text-slate-800">52%</span>
              </div>
           </div>

           {/* Edit Form */}
           <div className="w-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Codename</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all uppercase placeholder:text-slate-300"
                placeholder="ENTER NAME"
                maxLength={12}
              />
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/50 border-t border-slate-200">
           <button 
             onClick={handleSave}
             className="w-full btn-genshin-yellow py-3 rounded-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
           >
             <Save size={18} /> Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};
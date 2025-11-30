import React from 'react';
import { X, BookOpen, AlertTriangle, Shield, Skull, Zap } from 'lucide-react';
import { CardComponent } from './CardComponent';
import { Suit, CardValue } from '../types';

interface GameRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRules: React.FC<GameRulesProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Mock cards for visualization
  const mockLead = { id: 'r1', suit: Suit.Hearts, value: 10, display: '10' };
  const mockThulla = { id: 'r2', suit: Suit.Spades, value: 3, display: '3' };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#F2F3F5] w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-white/50 clip-slanted flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur p-6 flex justify-between items-center border-b border-slate-200 z-10">
           <div className="flex items-center gap-3 text-slate-800">
             <div className="bg-yellow-400 p-2 rounded-lg text-yellow-900 shadow-sm">
                <BookOpen size={24} />
             </div>
             <div>
                <h2 className="font-black italic uppercase text-2xl leading-none">Tactical Manual</h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thulla Escape v1.0</span>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors group">
             <X size={24} className="text-slate-400 group-hover:text-slate-800" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12">
           
           {/* Section 1: Overview */}
           <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1 h-6 bg-slate-800"></div>
                 <h3 className="text-xl font-black uppercase text-slate-800 tracking-wide">Mission Overview</h3>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium max-w-2xl">
                 <strong className="text-slate-900">Thulla Escape</strong> (Bhabhi) is a shedding card game. Your objective is simple: 
                 <span className="bg-yellow-100 text-yellow-800 px-1 mx-1 font-bold border border-yellow-200 rounded">EMPTY YOUR HAND</span> 
                 to escape. The last player holding cards loses and is branded the 
                 <span className="text-red-600 font-black mx-1">BHABHI</span>.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                    <Shield className="text-blue-500 mb-1" size={24} />
                    <h4 className="font-bold text-slate-800 text-sm uppercase">Defense</h4>
                    <p className="text-xs text-slate-500">Play high cards to win power and control the flow.</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                    <Zap className="text-yellow-500 mb-1" size={24} />
                    <h4 className="font-bold text-slate-800 text-sm uppercase">Attack</h4>
                    <p className="text-xs text-slate-500">Use "Thulla" to force opponents to pick up piles.</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                    <Skull className="text-slate-800 mb-1" size={24} />
                    <h4 className="font-bold text-slate-800 text-sm uppercase">Survival</h4>
                    <p className="text-xs text-slate-500">Don't be the last one standing.</p>
                 </div>
              </div>
           </section>

           {/* Section 2: Mechanics */}
           <section className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1 h-6 bg-slate-800"></div>
                 <h3 className="text-xl font-black uppercase text-slate-800 tracking-wide">Core Mechanics</h3>
              </div>

              <div className="space-y-4 pl-4 border-l-2 border-slate-200">
                 <div>
                    <h4 className="font-bold text-slate-800 uppercase text-sm mb-1">The First Trick</h4>
                    <p className="text-slate-600 text-sm">
                       Play starts clockwise. You <strong className="text-slate-900">MUST</strong> follow suit (Spades) if possible. 
                       The first trick is always completed and discarded to the waste pile. No penalties apply here.
                    </p>
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800 uppercase text-sm mb-1">Power Play</h4>
                    <p className="text-slate-600 text-sm">
                       In subsequent tricks, the player who played the highest card of the lead suit in the previous round gains <strong className="text-yellow-600">POWER</strong>.
                       The Power Holder leads the next trick with any card they choose.
                    </p>
                 </div>
              </div>
           </section>

           {/* Section 3: THULLA (Highlight) */}
           <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 p-8">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <AlertTriangle size={120} className="text-red-500" />
              </div>

              <div className="relative z-10">
                 <h3 className="text-2xl font-black uppercase text-red-600 tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle fill="currentColor" className="text-red-100" strokeWidth={2} />
                    The Thulla Rule
                 </h3>
                 
                 <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4 text-slate-800 font-medium">
                       <p>
                          If you cannot follow the lead suit, you may play <strong className="bg-red-100 px-1 rounded text-red-900">ANY CARD</strong>. This action is called a <strong>Thulla</strong> (or Tochoo).
                       </p>
                       <p>
                          The trick <strong>ENDS IMMEDIATELY</strong>.
                       </p>
                       <p className="text-sm bg-white/60 p-3 rounded-lg border border-red-100">
                          <strong>The Consequence:</strong> The player who played the highest card of the <em>original lead suit</em> so far must pick up <strong>ALL</strong> cards currently in the trick pile.
                       </p>
                    </div>

                    {/* Visual Example */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual Example</span>
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-1">
                             <span className="text-[10px] font-bold text-slate-500">Lead (P1)</span>
                             <div className="scale-75 origin-top">
                                <CardComponent card={mockLead} small />
                             </div>
                          </div>
                          <div className="text-slate-300 font-black">VS</div>
                          <div className="flex flex-col items-center gap-1">
                             <span className="text-[10px] font-bold text-red-500">Thulla (You)</span>
                             <div className="scale-75 origin-top relative">
                                <CardComponent card={mockThulla} small />
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded shadow-sm animate-bounce">
                                   !
                                </div>
                             </div>
                          </div>
                       </div>
                       <p className="text-center text-[10px] text-slate-500 max-w-[150px] leading-tight">
                          You played Spades on a Hearts lead. <br/>
                          <strong className="text-slate-800">P1 must pick up both cards.</strong>
                       </p>
                    </div>
                 </div>
              </div>
           </section>

           {/* Section 4: Scoring */}
           <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1 h-6 bg-slate-800"></div>
                 <h3 className="text-xl font-black uppercase text-slate-800 tracking-wide">Scoring & Penalties</h3>
              </div>
              
              <div className="bg-slate-900 text-white rounded-xl overflow-hidden shadow-lg">
                 <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider bg-slate-800 p-3 text-slate-400">
                    <div>Rank</div>
                    <div className="col-span-2">Condition</div>
                    <div className="text-right">Penalty Pts</div>
                 </div>
                 <div className="p-3 grid grid-cols-4 items-center border-b border-slate-800">
                    <div className="font-black text-yellow-400 text-lg">1st</div>
                    <div className="col-span-2 text-sm font-bold">First to Escape</div>
                    <div className="text-right font-mono text-slate-400">0 pts</div>
                 </div>
                 <div className="p-3 grid grid-cols-4 items-center border-b border-slate-800">
                    <div className="font-bold text-slate-300">2nd</div>
                    <div className="col-span-2 text-sm text-slate-300">Second out</div>
                    <div className="text-right font-mono text-slate-400">1 pt</div>
                 </div>
                 <div className="p-3 grid grid-cols-4 items-center border-b border-slate-800 bg-red-500/10">
                    <div className="font-bold text-red-400">Last</div>
                    <div className="col-span-2 text-sm text-red-200">The Bhabhi</div>
                    <div className="text-right font-mono text-red-400">3 pts</div>
                 </div>
              </div>
              <p className="text-xs text-slate-500 italic text-center mt-2">
                 *First player to reach 6 penalty points loses the match.
              </p>
           </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-200 flex justify-end">
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold uppercase hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
           >
             Understood
           </button>
        </div>
      </div>
    </div>
  );
};
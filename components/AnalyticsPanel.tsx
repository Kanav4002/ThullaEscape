import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { StatPoint, Player } from '../types';
import { Trophy, TrendingUp, AlertTriangle, X } from 'lucide-react';

interface AnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  winRateData: StatPoint[];
  thullaData: StatPoint[];
  players: Player[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ isOpen, onClose, winRateData, thullaData, players }) => {
  return (
    <div className={`
      fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#F2F3F5] shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="p-8 space-y-8 min-h-full relative">
        {/* Background Grid */}
        <div className="absolute inset-0 genshin-grid opacity-50 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center relative z-10">
          <div>
            <div className="flex items-center gap-2 text-yellow-600 font-bold tracking-widest text-xs uppercase mb-1">
              <TrendingUp size={14} /> Battle Data
            </div>
            <h2 className="text-3xl font-black text-slate-800 italic uppercase">Analytics</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Win Rate Chart */}
        <div className="space-y-2 relative z-10">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clip-slanted-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-yellow-400 rounded-full"></span>
              PERFORMANCE HISTORY
            </h3>
            {/* Added style={{ width: '100%', height: 200, minWidth: 0 }} to fix Recharts error */}
            <div style={{ width: '100%', height: 200, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={winRateData}>
                  <defs>
                    <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#EAB308" strokeWidth={3} fillOpacity={1} fill="url(#colorWin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Thulla Stats */}
        <div className="space-y-2 relative z-10">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clip-slanted-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-500 rounded-full"></span>
              PENALTY DISTRIBUTION
            </h3>
             {/* Added style={{ width: '100%', height: 160, minWidth: 0 }} to fix Recharts error */}
            <div style={{ width: '100%', height: 160, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={thullaData}>
                  <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                     cursor={{fill: '#f1f5f9'}}
                     contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: 'none' }}
                  />
                  <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2 relative z-10">
           <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase mb-2 ml-1">Room Standing</h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {players.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black w-6 ${idx === 0 ? 'text-yellow-500 text-lg' : 'text-slate-300'}`}>
                    {idx === 0 ? '01' : `0${idx + 1}`}
                  </span>
                  <div className="w-8 h-8 rounded bg-slate-200 overflow-hidden">
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm font-bold ${p.id === 'p1' ? 'text-slate-900' : 'text-slate-600'}`}>
                    {p.name}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {Math.floor(Math.random() * 99)}% WR
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
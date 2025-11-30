import React, { useState } from 'react';
import { api, setToken } from '../api';
import { Zap, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

interface Props {
  onAuthed: (userId: string) => void;
}

export const AuthView: React.FC<Props> = ({ onAuthed }) => {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      let result;
      if (mode === 'register') {
        result = await api.register({ name: name || 'Agent', email, password });
      } else {
        result = await api.login({ email, password });
      }
      setToken(result.token);
      onAuthed(result.user.id);
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background Image - Dark poker table with chips */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=3840')`,
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/50 to-slate-900/70"></div>

      {/* Floating card suits decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {['♠', '♥', '♦', '♣'].map((suit, i) => (
          <div
            key={i}
            className="absolute text-white text-8xl font-bold"
            style={{
              left: `${10 + i * 25}%`,
              top: `${15 + (i % 2) * 50}%`,
              animation: `float ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {suit}
          </div>
        ))}
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 text-cyan-400 font-black tracking-widest text-sm uppercase bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full w-fit mx-auto border border-cyan-400/40 mb-4">
            <Zap size={16} fill="currentColor" /> Thulla Escape
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
            THULLA<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">ESCAPE</span>
          </h1>
        </div>

        {/* Glass Card */}
        <form onSubmit={handleSubmit} className="bg-white/15 backdrop-blur-2xl border border-white/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Glassy shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white uppercase mb-6 text-center">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>

            {mode === 'register' && (
              <div className="mb-4">
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Agent Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all font-medium"
                    placeholder="Enter your name"
                    value={name} 
                    onChange={e=>setName(e.target.value)} 
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input 
                  type="email" 
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all font-medium"
                  placeholder="Enter your email"
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input 
                  type="password" 
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all font-medium"
                  placeholder="Enter your password"
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                {error}
              </div>
            )}

            <button 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 text-lg"
            >
              {loading ? (
                'Please wait…'
              ) : mode === 'login' ? (
                <><LogIn size={22} /> Login</>
              ) : (
                <><UserPlus size={22} /> Create Account</>
              )}
            </button>

            <div className="text-white/70 mt-6 text-center font-medium">
              {mode === 'login' ? (
                <>Don't have an account? <button type="button" className="text-cyan-400 font-bold hover:underline" onClick={()=>setMode('register')}>Register</button></>
              ) : (
                <>Already have an account? <button type="button" className="text-cyan-400 font-bold hover:underline" onClick={()=>setMode('login')}>Login</button></>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs font-mono font-black uppercase tracking-[0.3em] text-white/50">Thulla Escape • v1.0</p>
        </div>
      </div>

      {/* Float animation style */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

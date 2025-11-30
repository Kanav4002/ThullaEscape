import React, { useState, useEffect } from 'react';
import { GameState, Card, Player } from './types';
import { generateDeck, MOCK_PLAYERS, WIN_RATE_DATA, THULLA_STATS } from './constants';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { GameResults } from './components/GameResults';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ProfileModal } from './components/ProfileModal';
import { GameRules } from './components/GameRules';
import { GameLogo } from './components/GameLogo';
import { BarChart3, Menu, Bell, BookOpen, LogOut, Plus, Users, X } from 'lucide-react';
import { AuthView } from './components/AuthView';
import { api, getToken, setToken } from './api';
import { connectSocket, getSocket, disconnectSocket } from './socket';

const TURN_DURATION = 30; // Seconds

const App: React.FC = () => {
  // Enrich mock players with levels for UI
  const playersWithLevels: Player[] = MOCK_PLAYERS.map(p => ({ ...p, level: Math.floor(Math.random() * 20) + 1 }));

  const [authed, setAuthed] = useState<boolean>(!!getToken());
  const [userLoading, setUserLoading] = useState<boolean>(!!getToken());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roomInput, setRoomInput] = useState<string>('');

  const [gameState, setGameState] = useState<GameState>({
    roomCode: '',
    players: [],
    status: 'lobby',
    currentTurnPlayerId: '',
    trick: [],
    deck: [],
    lastTrickWinner: undefined,
    turnTimeLeft: TURN_DURATION,
  });

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [finishOrder, setFinishOrder] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');
  
  // Timer Ref

  useEffect(() => {
    const init = async () => {
      if (!getToken()) return;
      try {
        const user = await api.me();
        setCurrentUserId(user.id);
        setAuthed(true);
      } catch {
        setToken('');
        setAuthed(false);
      } finally {
        setUserLoading(false);
      }
    };
    init();
  }, []);

  // Connect socket on auth
  useEffect(() => {
    if (!authed) return;
    const s = connectSocket();
    const onRoomUpdate = (dto: any) => {
      setGameState(prev => ({ ...prev, roomCode: dto.code, players: dto.players, status: dto.status as any }));
    };
    const onGameStart = (dto: any) => {
      setGameState(prev => ({ ...prev, status: 'playing' }));
    };
    const onGameState = (state: any) => {
      // Merge authoritative server state, preserving hand if not sent
      setGameState(prev => {
        // Build a map of previous hands to preserve them
        const prevHands = new Map<string, any[]>();
        prev.players.forEach(p => {
          if (p.hand && p.hand.length > 0) {
            prevHands.set(p.id, p.hand);
          }
        });
        
        return {
          ...prev,
          roomCode: state.roomCode,
          status: state.status,
          currentTurnPlayerId: state.currentTurnPlayerId,
          players: state.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            level: p.level ?? 1,
            cardCount: p.cardCount ?? 0,
            isBot: p.isBot ?? false,
            status: p.status ?? 'active',
            isTurn: p.isTurn ?? false,
            // Use new hand if provided (and non-empty), otherwise preserve previous hand
            hand: (p.hand && p.hand.length > 0) ? p.hand : prevHands.get(p.id),
          })),
          trick: state.trick ?? [],
          turnTimeLeft: state.turnTimeLeft ?? TURN_DURATION,
          deck: prev.deck,
        };
      });
      // Update finish order if provided
      if (state.finishOrder) {
        setFinishOrder(state.finishOrder);
      }
    };
    const onPlayerLeft = (data: any) => {
      setNotification(`${data.userId} left the game`);
      setTimeout(() => setNotification(null), 2000);
    };
    const onGameError = (data: any) => {
      setNotification(data.message || 'Game error');
      setTimeout(() => setNotification(null), 3000);
    };
    s.on('room_update', onRoomUpdate);
    s.on('game_start', onGameStart);
    s.on('game_state', onGameState);
    s.on('player_left', onPlayerLeft);
    s.on('game_error', onGameError);
    return () => {
      s.off('room_update', onRoomUpdate);
      s.off('game_start', onGameStart);
      s.off('game_state', onGameState);
      s.off('player_left', onPlayerLeft);
      s.off('game_error', onGameError);
    };
  }, [authed]);

  const handleCreateRoom = async () => {
    const s = getSocket();
    try {
      const room = await api.createRoom();
      setGameState(prev => ({ ...prev, roomCode: room.code, players: room.players, status: room.status as any }));
      s.emit('join_room', { code: room.code });
      setShowCreateModal(false);
    } catch (e: any) {
      setNotification(e.message);
      setTimeout(()=>setNotification(null), 2000);
    }
  };
  
  const handleJoinRoom = async () => {
    const s = getSocket();
    try {
      const room = await api.joinRoom(roomInput.trim());
      setGameState(prev => ({ ...prev, roomCode: room.code, players: room.players, status: room.status as any }));
      s.emit('join_room', { code: room.code });
      setShowJoinModal(false);
      setRoomInput('');
    } catch (e: any) {
      setNotification(e.message);
      setTimeout(()=>setNotification(null), 2000);
    }
  };

  const handleLogout = () => {
    setToken('');
    disconnectSocket();
    setAuthed(false);
    setCurrentUserId(null);
    setGameState(prev => ({ ...prev, status: 'lobby', players: [], roomCode: '' }));
  };

  const handlePlayAgain = async () => {
    // Reset game state and go back to lobby
    setFinishOrder([]);
    setGameState(prev => ({ ...prev, status: 'lobby', trick: [], currentTurnPlayerId: '' }));
  };

  const handleBackToLobby = async () => {
    try {
      await api.leaveGame(gameState.roomCode);
    } catch {}
    setFinishOrder([]);
    setGameState(prev => ({ ...prev, status: 'lobby', trick: [], deck: [], currentTurnPlayerId: '', roomCode: '', players: [] }));
  };
  const handleStartServerGame = async () => {
    const s = getSocket();
    try {
      const room = await api.startRoom(gameState.roomCode);
      setGameState(prev => ({ ...prev, status: room.status as any }));
      // Server will emit game_state, no need for local demo mechanics
    } catch (e: any) {
      setNotification(e.message);
      setTimeout(()=>setNotification(null), 2000);
    }
  };

  const handleLeaveGame = async () => {
    try {
      await api.leaveGame(gameState.roomCode);
      setGameState(prev => ({ ...prev, status: 'lobby', trick: [], deck: [], currentTurnPlayerId: '' }));
    } catch (e: any) {
      setNotification(e.message);
      setTimeout(()=>setNotification(null), 2000);
    }
  };

  // Client-side timer countdown (syncs with server's turnTimeLeft)
  useEffect(() => {
    if ((gameState.status !== 'playing' && gameState.status !== 'shootout') || !gameState.currentTurnPlayerId) {
      return;
    }
    
    // Start a local countdown that decrements every second
    const interval = window.setInterval(() => {
      setGameState(prev => {
        if (prev.turnTimeLeft <= 1) {
          // Time's up - notify server if it's our turn
          if (prev.currentTurnPlayerId === currentUserId) {
            const s = getSocket();
            s.emit('timeout', { code: prev.roomCode });
          }
          return { ...prev, turnTimeLeft: 0 };
        }
        return { ...prev, turnTimeLeft: prev.turnTimeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.status, gameState.currentTurnPlayerId, currentUserId]);

  const passTurn = (currentState: GameState) => {
    const currentIndex = currentState.players.findIndex(p => p.id === currentState.currentTurnPlayerId);
    const nextIndex = (currentIndex + 1) % currentState.players.length;
    const nextPlayerId = currentState.players[nextIndex].id;

    setGameState(prev => ({
      ...prev,
      currentTurnPlayerId: nextPlayerId,
      turnTimeLeft: TURN_DURATION,
      players: prev.players.map(p => ({ ...p, isTurn: p.id === nextPlayerId }))
    }));
    
    // If next is bot, simulate play
    if (nextPlayerId !== 'p1') {
      setTimeout(() => simulateBotPlay(nextPlayerId), 1000);
    }
  };

  const handleStartGame = () => {
    const deck = generateDeck();
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      deck,
      players: prev.players.map(p => p.id === 'p2' ? { ...p, isTurn: true } : { ...p, isTurn: false })
    }));
    // Start with P2 (Bot) for demo
    setTimeout(() => simulateBotPlay('p2'), 1000);
  };

  const handlePlayCard = async (card: Card) => {
    try {
      // Send to server for validation
      const s = getSocket();
      s.emit('play_card', { code: gameState.roomCode, cardId: card.id });
      // Server will broadcast game_state update
    } catch (e: any) {
      setNotification(e.message || 'Failed to play card');
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleUpdateProfile = async (name: string, avatar: string) => {
    try {
      await api.updateMe({ name, avatar });
    } catch (e: any) {
      setNotification(e.message || 'Failed to update profile');
    }
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === 'p1' ? { ...p, name, avatar } : p)
    }));
  };

  const simulateBotPlay = (playerId: string) => {
    // In a real app, check if turn is valid
    setGameState(prev => {
        // Pick random card
        const randomCard = prev.deck[Math.floor(Math.random() * prev.deck.length)];
        const mockCard = { ...randomCard, id: `${randomCard.id}-${playerId}-${Date.now()}` };
        
        const newTrick = [
            ...prev.trick,
            { card: mockCard, playedBy: playerId, rotation: (Math.random() * 40) - 20 }
        ];

        // Check for trick end (every 8 cards roughly) or random clear
        if (newTrick.length >= prev.players.length) {
            setTimeout(handleTrickEnd, 1500);
            return {
                ...prev,
                trick: newTrick,
                currentTurnPlayerId: '', // Pause turns while clearing
            };
        }
        
        return {
            ...prev,
            trick: newTrick
        };
    });
    
    setTimeout(() => {
        setGameState(current => {
             // If we just cleared trick, don't pass turn yet, handleTrickEnd will do it
             if (current.trick.length >= current.players.length) return current;
             passTurn(current);
             return current;
        });
    }, 1000);
  };

  const handleTrickEnd = () => {
    setNotification("Trick Cleared!");
    setTimeout(() => setNotification(null), 2000);
    setGameState(prev => ({
      ...prev,
      trick: [],
      currentTurnPlayerId: 'p1', // Force back to user for demo flow or winner logic
      players: prev.players.map(p => p.id === 'p1' ? { ...p, isTurn: true } : { ...p, isTurn: false })
    }));
  };

  if (!authed) {
    if (userLoading) return <div className="w-screen h-screen flex items-center justify-center">Loading…</div>;
    return <AuthView onAuthed={(userId) => { setCurrentUserId(userId); setAuthed(true); }} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 text-slate-900 font-sans relative">
      
      {/* Toast Notification - MOVED TO CENTER/BOTTOM to prevent blocking avatars */}
      {notification && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
          <div className="glass-panel px-6 py-4 rounded-xl border border-yellow-400 shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
             <div className="bg-yellow-400 p-2 rounded-full text-yellow-900">
               <Bell size={24} fill="currentColor" />
             </div>
             <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Alert</span>
                <span className="text-lg font-black uppercase tracking-wide text-slate-800">{notification}</span>
             </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar (In Game) */}
      {(gameState.status === 'playing' || gameState.status === 'shootout') && (
        <nav className="fixed top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex justify-between items-center px-4 md:px-6 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-lg p-1.5 shadow-md">
               <GameLogo />
            </div>
            <div className="hidden md:block h-6 w-px bg-slate-300 mx-2"></div>
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Signal Strength: Strong
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setShowRules(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="How to Play">
              <BookOpen size={24} />
            </button>
            <button onClick={() => setShowAnalytics(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Analytics">
              <BarChart3 size={24} />
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 transition-colors text-white rounded-full shadow-lg"
              title="Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="h-full w-full">
        {gameState.status === 'lobby' && (
          <div className="relative h-full w-full">
            {/* Top Right Action Bar */}
            <div className="absolute top-4 right-4 z-20 flex gap-2 items-center">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white text-sm font-bold rounded-lg shadow-lg hover:bg-white/20 hover:scale-105 transition-all border border-white/20"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Create</span>
              </button>
              <button 
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white text-sm font-bold rounded-lg shadow-lg hover:bg-white/20 hover:scale-105 transition-all border border-white/20"
              >
                <Users size={18} />
                <span className="hidden sm:inline">Join</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white text-sm font-bold rounded-lg shadow-lg hover:bg-red-500/30 hover:scale-105 transition-all border border-white/20"
                title="Logout"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            {/* Current Room Info - Below action buttons */}
            {gameState.roomCode && gameState.roomCode.length > 0 && (
              <div className="absolute top-16 right-4 z-20 bg-slate-800/90 backdrop-blur px-4 py-2.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Share Code</span>
                  <span className="font-mono font-black text-lg text-white tracking-wider">{gameState.roomCode}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(gameState.roomCode);
                    setNotification('Room code copied!');
                    setTimeout(() => setNotification(null), 1500);
                  }}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
                  title="Copy code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            )}

            <Lobby 
              roomCode={gameState.roomCode} 
              players={gameState.players} 
              onStart={handleStartServerGame} 
              onOpenRules={() => setShowRules(true)}
            />
          </div>
        )}
        
        {(gameState.status === 'playing' || gameState.status === 'shootout') && (
          <GameBoard 
            gameState={gameState}
            currentUserId={currentUserId}
            onPlayCard={handlePlayCard}
            onLeaveGame={handleLeaveGame}
          />
        )}

        {gameState.status === 'ended' && (
          <GameResults
            players={gameState.players}
            finishOrder={finishOrder}
            currentUserId={currentUserId}
            onPlayAgain={handlePlayAgain}
            onBackToLobby={handleBackToLobby}
          />
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white">Create New Room</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🃏</div>
              <p className="text-slate-400">Start a new Thulla Escape room and invite your friends to join!</p>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg text-lg"
            >
              Create Room
            </button>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowJoinModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">Join Room</h2>
              <button onClick={() => setShowJoinModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Room Code</label>
              <input
                type="text"
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-4 text-2xl font-mono font-bold text-center tracking-[0.5em] border-2 border-slate-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all uppercase"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={roomInput.length < 4}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Join Game
            </button>
          </div>
        </div>
      )}

      {/* Overlays */}
      <AnalyticsPanel 
        isOpen={showAnalytics} 
        onClose={() => setShowAnalytics(false)}
        winRateData={WIN_RATE_DATA}
        thullaData={THULLA_STATS}
        players={gameState.players}
      />
      
      <ProfileModal 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        player={gameState.players.find(p => p.id === currentUserId) || gameState.players[0]}
        onUpdate={handleUpdateProfile}
      />

      <GameRules 
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />
      
    </div>
  );
};

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Card, Player } from './types';
import { generateDeck, MOCK_PLAYERS, WIN_RATE_DATA, THULLA_STATS } from './constants';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ProfileModal } from './components/ProfileModal';
import { GameRules } from './components/GameRules';
import { GameLogo } from './components/GameLogo';
import { BarChart3, Menu, Bell, BookOpen } from 'lucide-react';

const TURN_DURATION = 15; // Seconds

const App: React.FC = () => {
  // Enrich mock players with levels for UI
  const playersWithLevels: Player[] = MOCK_PLAYERS.map(p => ({ ...p, level: Math.floor(Math.random() * 20) + 1 }));

  const [gameState, setGameState] = useState<GameState>({
    roomCode: 'THULLA-X',
    players: playersWithLevels,
    status: 'lobby',
    currentTurnPlayerId: 'p2',
    trick: [],
    deck: [],
    lastTrickWinner: undefined,
    turnTimeLeft: TURN_DURATION,
  });

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Timer Ref
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState.status === 'playing') {
      startTurnTimer();
    }
    return () => stopTurnTimer();
  }, [gameState.status, gameState.currentTurnPlayerId]);

  const startTurnTimer = () => {
    stopTurnTimer();
    setGameState(prev => ({ ...prev, turnTimeLeft: TURN_DURATION }));
    
    timerRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.turnTimeLeft <= 1) {
          handleTimeout(prev);
          return prev;
        }
        return { ...prev, turnTimeLeft: prev.turnTimeLeft - 1 };
      });
    }, 1000);
  };

  const stopTurnTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimeout = (currentState: GameState) => {
    stopTurnTimer();
    const currentPlayer = currentState.players.find(p => p.id === currentState.currentTurnPlayerId);
    if (!currentPlayer) return;

    // Trigger Thulla Penalty for Timeout
    setNotification(`${currentPlayer.name} ran out of time! Penalty applied.`);
    setGameState(prev => ({ ...prev, penaltyMessage: "TIMEOUT: TURN SKIPPED" }));

    setTimeout(() => {
       setNotification(null);
       setGameState(prev => ({ ...prev, penaltyMessage: undefined }));
       // Skip turn logic for demo
       passTurn(currentState);
    }, 2000);
  };

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

  const handlePlayCard = (card: Card) => {
    stopTurnTimer();
    
    // User plays card
    const newTrick = [
      ...gameState.trick,
      { card, playedBy: 'p1', rotation: (Math.random() * 20) - 10 }
    ];

    setGameState(prev => ({
      ...prev,
      trick: newTrick,
      turnTimeLeft: TURN_DURATION,
    }));

    // Pass to next
    passTurn(gameState);
  };

  const handleUpdateProfile = (name: string, avatar: string) => {
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F2F3F5] text-slate-900 font-sans relative">
      
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
      {gameState.status === 'playing' && (
        <nav className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md border-b border-white flex justify-between items-center px-4 md:px-6 z-40">
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
      <main className="h-full w-full pt-0 md:pt-16">
        {gameState.status === 'lobby' && (
          <Lobby 
            roomCode={gameState.roomCode} 
            players={gameState.players} 
            onStart={handleStartGame} 
            onOpenRules={() => setShowRules(true)}
          />
        )}
        
        {gameState.status === 'playing' && (
          <GameBoard 
            gameState={gameState} 
            onPlayCard={handlePlayCard} 
          />
        )}
      </main>

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
        player={gameState.players.find(p => p.id === 'p1') || gameState.players[0]}
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
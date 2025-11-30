import { randomUUID } from 'crypto';

const SUITS = ['♠', '♥', '♣', '♦'];
const VALUE_DEFS = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
  { value: 11, label: 'J' },
  { value: 12, label: 'Q' },
  { value: 13, label: 'K' },
  { value: 14, label: 'A' },
];

const TURN_DURATION_MS = 30_000;

function generateDeck(numDecks = 1) {
  const deck = [];
  for (let deckIdx = 0; deckIdx < numDecks; deckIdx++) {
    for (const suit of SUITS) {
      for (const def of VALUE_DEFS) {
        deck.push({
          id: `${suit}-${def.label}-${randomUUID()}`,
          suit,
          value: def.value,
          display: def.label,
        });
      }
    }
  }
  return deck;
}

function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sanitizePlayers(game, viewerId) {
  return game.players.map((player) => ({
    id: player.userId,
    name: player.name,
    avatar: player.avatar,
    level: player.level ?? 1,
    cardCount: player.hand.length,
    isBot: false,
    status: player.status,
    isTurn: player.userId === game.currentTurnPlayerId,
    hand: viewerId && viewerId === player.userId ? player.hand : undefined,
  }));
}

function trickEntry(card, userId) {
  return {
    card,
    playedBy: userId,
    rotation: (Math.random() * 30) - 15,
  };
}

class GameManager {
  constructor() {
    this.games = new Map();
  }

  start(roomCode, players) {
    if (!players || players.length < 3) {
      throw new Error('NOT_ENOUGH_PLAYERS');
    }
    if (players.length > 8) {
      throw new Error('TOO_MANY_PLAYERS');
    }
    const existing = this.games.get(roomCode);
    if (existing) {
      this.games.delete(roomCode);
    }

    const numDecks = players.length >= 7 ? 2 : 1;
    const orderedPlayers = [...players].map((p, idx) => ({
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      level: p.level ?? 1,
      order: typeof p.order === 'number' ? p.order : idx,
      status: 'active',
      hand: [],
      penaltyPoints: 0,
    })).sort((a, b) => a.order - b.order);

    const shuffledDeck = shuffle(generateDeck(numDecks));
    
    // Find and place Ace of Spades in center
    const aceOfSpadesIdx = shuffledDeck.findIndex(c => c.suit === '♠' && c.value === 14);
    let aceOfSpades = null;
    if (aceOfSpadesIdx >= 0) {
      aceOfSpades = shuffledDeck.splice(aceOfSpadesIdx, 1)[0];
    }

    // Deal remaining cards
    shuffledDeck.forEach((card, idx) => {
      orderedPlayers[idx % orderedPlayers.length].hand.push(card);
    });

    const currentTurnPlayerId = orderedPlayers[0].userId;
    const game = {
      roomCode,
      status: 'playing',
      players: orderedPlayers,
      trick: aceOfSpades ? [trickEntry(aceOfSpades, 'dealer')] : [],
      leadSuit: '♠', // First trick is always spades
      powerHolder: null,
      wastePile: [],
      currentTurnPlayerId,
      turnExpiresAt: Date.now() + TURN_DURATION_MS,
      trickNumber: 1,
      isFirstTrick: true,
      thullaTriggered: false,
      finishOrder: [],
    };

    this.games.set(roomCode, game);
    return this.serialize(game, null);
  }

  getState(roomCode, viewerId = null) {
    const game = this.games.get(roomCode);
    if (!game) return null;
    return this.serialize(game, viewerId);
  }

  playCard(roomCode, userId, cardId) {
    const game = this._requireGame(roomCode);
    if (game.status !== 'playing' && game.status !== 'shootout') throw new Error('GAME_NOT_ACTIVE');
    if (game.currentTurnPlayerId !== userId) throw new Error('NOT_YOUR_TURN');

    const player = this._requirePlayer(game, userId);
    if (player.status !== 'active') throw new Error('PLAYER_NOT_ACTIVE');
    
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('CARD_NOT_IN_HAND');
    const card = player.hand[cardIndex];

    // Validate play
    this._validatePlay(game, player, card, cardIndex);

    // Remove card from hand
    player.hand.splice(cardIndex, 1);
    game.trick.push(trickEntry(card, userId));

    // Check for thulla (playing off-suit when you have no lead suit)
    const isThulla = game.leadSuit && card.suit !== game.leadSuit;
    
    if (isThulla && !game.isFirstTrick) {
      game.thullaTriggered = true;
      this._resolveThullaTrick(game);
    } else if (this._shouldResolveTrick(game)) {
      // Trick is complete - resolve it
      this._resolveTrick(game);
    } else {
      // Trick not complete yet - advance to next player
      this._advanceTurn(game, userId);
    }

    // After trick resolution or turn advance, check if player finished
    if (player.hand.length === 0 && player.status === 'active') {
      this._handlePlayerFinish(game, player);
    }

    return this.serialize(game, userId);
  }

  skipTurn(roomCode, userId) {
    const game = this._requireGame(roomCode);
    if (game.status !== 'playing' && game.status !== 'shootout') return this.serialize(game, null);
    if (game.currentTurnPlayerId !== userId) return this.serialize(game, null);
    
    // Advance to next player
    this._advanceTurn(game, userId);
    return this.serialize(game, null);
  }

  leaveGame(roomCode, userId) {
    const game = this._requireGame(roomCode);
    const player = this._requirePlayer(game, userId);
    
    // Add all player's cards to waste pile
    if (player.hand.length > 0) {
      game.wastePile.push(...player.hand);
      player.hand = [];
    }
    
    // Mark as left
    player.status = 'left';
    
    // If it was their turn, advance
    if (game.currentTurnPlayerId === userId) {
      this._advanceTurn(game, userId);
    }
    
    // Check if game should end
    const activePlayers = this._activePlayers(game);
    if (activePlayers.length <= 1) {
      if (activePlayers.length === 1) {
        activePlayers[0].status = 'bhabhi';
        game.finishOrder.push(activePlayers[0].userId);
      }
      game.status = 'ended';
      game.currentTurnPlayerId = null;
    }
    
    return this.serialize(game, null);
  }

  reset(roomCode) {
    this.games.delete(roomCode);
  }

  _validatePlay(game, player, card, cardIndex) {
    if (game.trick.length === 0) {
      // Leading - any card is valid
      game.leadSuit = card.suit;
      return;
    }

    if (!game.leadSuit) {
      game.leadSuit = card.suit;
      return;
    }

    // Must follow suit if possible
    const hasLeadSuit = player.hand.some((c, idx) => idx !== cardIndex && c.suit === game.leadSuit);
    if (hasLeadSuit && card.suit !== game.leadSuit) {
      throw new Error('MUST_FOLLOW_SUIT');
    }
  }

  _handlePlayerFinish(game, player) {
    // Already finished? Skip
    if (player.status === 'finished' || player.status === 'bhabhi') {
      return;
    }
    
    // Player must have 0 cards to finish
    if (player.hand.length > 0) {
      return;
    }

    // NOTE: Power block rule is disabled for now as it was causing issues
    // The rule states: if you hold power and try to finish, you must draw from waste
    // This can be re-enabled later with proper testing
    // if (game.powerHolder === player.userId && game.wastePile.length > 0) {
    //   const shuffledWaste = shuffle([...game.wastePile]);
    //   const drawnCard = shuffledWaste[0];
    //   player.hand.push(drawnCard);
    //   game.wastePile = shuffledWaste.slice(1);
    //   return;
    // }

    // Player successfully finished
    player.status = 'finished';
    if (!game.finishOrder.includes(player.userId)) {
      game.finishOrder.push(player.userId);
    }

    // Check remaining playable players
    const playable = this._playablePlayers(game);
    
    if (playable.length === 2) {
      game.status = 'shootout';
    } else if (playable.length === 1) {
      // Last player is bhabhi
      playable[0].status = 'bhabhi';
      if (!game.finishOrder.includes(playable[0].userId)) {
        game.finishOrder.push(playable[0].userId);
      }
      game.status = 'ended';
      game.currentTurnPlayerId = null;
    } else if (playable.length === 0) {
      game.status = 'ended';
      game.currentTurnPlayerId = null;
    }
  }

  _resolveThullaTrick(game) {
    // Thulla triggered - find highest lead suit card
    const leadSuitCards = game.trick.filter(play => play.card.suit === game.leadSuit);
    
    if (leadSuitCards.length === 0) {
      // No lead suit cards, first card wins
      game.powerHolder = game.trick[0].playedBy;
    } else {
      // Highest lead suit card wins
      let winningPlay = leadSuitCards[0];
      for (const play of leadSuitCards) {
        if (play.card.value > winningPlay.card.value) {
          winningPlay = play;
        }
      }
      game.powerHolder = winningPlay.playedBy;
    }

    // Winner picks up entire trick
    const winner = this._requirePlayer(game, game.powerHolder);
    const trickCards = game.trick.map(entry => entry.card);
    winner.hand.push(...trickCards);

    // Clear trick
    game.trick = [];
    game.leadSuit = null;
    game.thullaTriggered = false;
    game.isFirstTrick = false;
    game.trickNumber++;

    // Winner leads next
    this._setTurn(game, game.powerHolder);
  }

  _resolveTrick(game) {
    if (!game.trick.length) return;
    
    const leadSuit = game.leadSuit || game.trick[0].card.suit;

    if (game.isFirstTrick) {
      // First trick - discard all cards, no winner
      game.wastePile.push(...game.trick.map(entry => entry.card));
      game.trick = [];
      game.leadSuit = null;
      game.isFirstTrick = false;
      game.trickNumber++;
      
      // Next player after dealer starts
      this._advanceTurn(game, game.players[0].userId);
      return;
    }

    // Find highest lead suit card
    const leadSuitCards = game.trick.filter(play => play.card.suit === leadSuit);
    
    if (leadSuitCards.length === 0) {
      // Should not happen in complete trick, but handle gracefully
      game.powerHolder = game.trick[0].playedBy;
    } else {
      let winningPlay = leadSuitCards[0];
      for (const play of leadSuitCards) {
        if (play.card.value > winningPlay.card.value) {
          winningPlay = play;
        }
      }
      game.powerHolder = winningPlay.playedBy;
    }

    // Discard trick to waste
    game.wastePile.push(...game.trick.map(entry => entry.card));
    game.trick = [];
    game.leadSuit = null;
    game.trickNumber++;

    // Power holder leads next
    const winner = this._requirePlayer(game, game.powerHolder);
    
    // Check if winner just finished
    if (winner.hand.length === 0) {
      this._handlePlayerFinish(game, winner);
      if (game.status === 'ended') return;
      // Advance to next active player
      this._advanceTurn(game, game.powerHolder);
    } else {
      this._setTurn(game, game.powerHolder);
    }
  }

  _requireGame(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error('GAME_NOT_FOUND');
    }
    return game;
  }

  _requirePlayer(game, userId) {
    const player = game.players.find((p) => p.userId === userId);
    if (!player) throw new Error('PLAYER_NOT_IN_GAME');
    return player;
  }

  _activePlayers(game) {
    return game.players.filter((p) => p.status === 'active');
  }

  _playablePlayers(game) {
    return game.players.filter((p) => p.status === 'active' && p.hand.length > 0);
  }

  _shouldResolveTrick(game) {
    if (game.thullaTriggered) return false; // Already resolved via thulla
    
    // Count active players (includes those who just played their last card)
    const activePlayers = game.players.filter(p => p.status === 'active');
    const expectedPlays = game.isFirstTrick ? game.players.length : activePlayers.length;
    
    return game.trick.length >= expectedPlays;
  }

  _advanceTurn(game, fromUserId) {
    const ordered = [...game.players].sort((a, b) => a.order - b.order);
    let cursor = ordered.findIndex((p) => p.userId === fromUserId);
    if (cursor === -1) {
      cursor = 0;
    }
    
    // Find next playable player
    for (let i = 1; i <= ordered.length; i++) {
      const next = ordered[(cursor + i) % ordered.length];
      if (next.status === 'active' && next.hand.length > 0) {
        this._setTurn(game, next.userId);
        return;
      }
    }
    
    // No next player found in loop - check game state
    const playable = this._playablePlayers(game);
    
    if (playable.length === 0) {
      // No one has cards - game over
      game.status = 'ended';
      game.currentTurnPlayerId = null;
    } else if (playable.length === 1) {
      // Only one player left with cards - they're bhabhi
      playable[0].status = 'bhabhi';
      if (!game.finishOrder.includes(playable[0].userId)) {
        game.finishOrder.push(playable[0].userId);
      }
      game.status = 'ended';
      game.currentTurnPlayerId = null;
    } else {
      // Multiple players but couldn't find next - set to first playable
      this._setTurn(game, playable[0].userId);
    }
  }

  _setTurn(game, userId) {
    game.currentTurnPlayerId = userId;
    game.turnExpiresAt = Date.now() + TURN_DURATION_MS;
  }

  serialize(game, viewerId) {
    const turnTimeLeft = game.currentTurnPlayerId
      ? Math.max(0, Math.round((game.turnExpiresAt - Date.now()) / 1000))
      : 0;

    return {
      roomCode: game.roomCode,
      status: game.status,
      currentTurnPlayerId: game.currentTurnPlayerId,
      powerHolder: game.powerHolder,
      trick: game.trick.map((entry) => ({ ...entry })),
      turnTimeLeft,
      trickNumber: game.trickNumber,
      isFirstTrick: game.isFirstTrick,
      wastePileCount: game.wastePile.length,
      finishOrder: game.finishOrder,
      players: sanitizePlayers(game, viewerId),
    };
  }
}

export const gameManager = new GameManager();

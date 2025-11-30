import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { gameManager } from './game/gameManager.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.statusCode = status;
  }
}

app.use(cors({ origin: '*' }));
app.use(express.json());

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Helpers
function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

const ROOM_WITH_PLAYERS = {
  players: {
    include: { user: true },
    orderBy: { createdAt: 'asc' }
  },
  owner: true,
};

function toLobbyPlayer(player, status) {
  return {
    id: player.userId,
    name: player.name,
    avatar: player.avatar,
    level: player.user?.level ?? 1,
    cardCount: 0,
    isBot: false,
    status,
    isTurn: false,
  };
}

async function roomDto(code) {
  const room = await prisma.room.findUnique({
    where: { code },
    include: ROOM_WITH_PLAYERS,
  });
  if (!room) return null;
  const playerStatus = room.status === 'playing' ? 'active' : 'waiting';
  return {
    code: room.code,
    ownerId: room.ownerId,
    status: room.status,
    players: room.players.map((p) => toLobbyPlayer(p, playerStatus)),
  };
}

async function ensureRoomMembership(code, userId) {
  const membership = await prisma.roomPlayer.findFirst({ where: { roomCode: code, userId } });
  if (!membership) {
    throw new ApiError(403, 'You are not part of this room');
  }
  return membership;
}

function mapGameError(err) {
  switch (err.message) {
    case 'NOT_YOUR_TURN':
      return { status: 409, message: 'It is not your turn' };
    case 'CARD_NOT_IN_HAND':
      return { status: 400, message: 'Card not found in your hand' };
    case 'MUST_FOLLOW_SUIT':
      return { status: 400, message: 'You must follow the lead suit if possible' };
    case 'NOT_ENOUGH_PLAYERS':
      return { status: 400, message: 'Need at least two players to start' };
    case 'GAME_NOT_ACTIVE':
      return { status: 409, message: 'Game is not in a playable state' };
    case 'GAME_NOT_FOUND':
      return { status: 404, message: 'Game not found for room' };
    case 'PLAYER_NOT_IN_GAME':
      return { status: 403, message: 'Player is not part of this game' };
    default:
      return { status: err.statusCode || 400, message: err.message || 'Unable to process request' };
  }
}

async function startAuthoritativeGame(code, requesterId) {
  const room = await prisma.room.findUnique({
    where: { code },
    include: ROOM_WITH_PLAYERS,
  });
  if (!room) throw new ApiError(404, 'Room not found');
  if (room.ownerId !== requesterId) throw new ApiError(403, 'Only the owner can start the game');
  if (room.players.length < 3) throw new ApiError(400, 'Need at least 3 players to start');
  if (room.players.length > 8) throw new ApiError(400, 'Maximum 8 players allowed');

  await prisma.room.update({ where: { code }, data: { status: 'playing' } });
  const playersForGame = room.players.map((player, idx) => ({
    userId: player.userId,
    name: player.name,
    avatar: player.avatar,
    level: player.user?.level ?? 1,
    order: idx,
  }));

  gameManager.start(code, playersForGame);
  const dto = await roomDto(code);
  
  // Emit game_start to everyone
  io.to(`room:${code}`).emit('game_start', dto);
  
  // Emit personal game_state to each player with their hand
  const socketsInRoom = await io.in(`room:${code}`).fetchSockets();
  for (const socket of socketsInRoom) {
    const userId = socket.data.user?.sub;
    if (userId) {
      const personalState = gameManager.getState(code, userId);
      if (personalState) {
        socket.emit('game_state', personalState);
      }
    }
  }
  
  return dto;
}

// Auth routes
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: {
    email: email.toLowerCase(),
    name,
    avatar: `https://picsum.photos/seed/${Math.random().toString(36).slice(2,10)}/100/100`,
    password: passwordHash,
  }});
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

app.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, name: user.name, avatar: user.avatar });
});

app.put('/me', authMiddleware, async (req, res) => {
  const { name, avatar } = req.body || {};
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const updated = await prisma.user.update({ where: { id: user.id }, data: {
    name: typeof name === 'string' && name.trim() ? name.trim() : user.name,
    avatar: typeof avatar === 'string' && avatar.trim() ? avatar.trim() : user.avatar,
  }});
  await prisma.roomPlayer.updateMany({
    where: { userId: updated.id },
    data: { name: updated.name, avatar: updated.avatar },
  });
  res.json({ id: updated.id, email: updated.email, name: updated.name, avatar: updated.avatar });
});

// Rooms REST
app.post('/rooms', authMiddleware, async (req, res) => {
  const ownerId = req.user.sub;
  const code = generateRoomCode();
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) return res.status(404).json({ error: 'User not found' });
  const room = await prisma.room.create({ data: { code, ownerId } });
  await prisma.roomPlayer.create({ data: { roomCode: code, userId: ownerId, name: owner.name, avatar: owner.avatar } });
  res.json(await roomDto(code));
});

app.post('/rooms/join', authMiddleware, async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing room code' });
  const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.status !== 'lobby') return res.status(400).json({ error: 'Game already in progress' });
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  try {
    await prisma.roomPlayer.create({ data: { roomCode: room.code, userId: user.id, name: user.name, avatar: user.avatar } });
  } catch (e) {
    // ignore if already exists
  }
  const dto = await roomDto(room.code);
  io.to(`room:${room.code}`).emit('room_update', dto);
  res.json(dto);
});

app.get('/rooms/:code', authMiddleware, async (req, res) => {
  const dto = await roomDto(req.params.code.toUpperCase());
  if (!dto) return res.status(404).json({ error: 'Room not found' });
  res.json(dto);
});

app.post('/rooms/:code/start', authMiddleware, async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    const dto = await startAuthoritativeGame(code, req.user.sub);
    res.json(dto);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Failed to start game' });
  }
});

app.post('/rooms/:code/restart', authMiddleware, async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    const room = await prisma.room.findUnique({
      where: { code },
      include: ROOM_WITH_PLAYERS,
    });
    if (!room) throw new ApiError(404, 'Room not found');
    if (room.ownerId !== req.user.sub) throw new ApiError(403, 'Only the room leader can restart the game');
    
    // Reset game state
    gameManager.reset(code);
    
    // Update room status back to lobby first, then start new game
    await prisma.room.update({ where: { code }, data: { status: 'lobby' } });
    
    // Start new game
    const dto = await startAuthoritativeGame(code, req.user.sub);
    res.json(dto);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Failed to restart game' });
  }
});

app.get('/rooms/:code/game', authMiddleware, async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    await ensureRoomMembership(code, req.user.sub);
    const state = gameManager.getState(code, req.user.sub);
    if (!state) return res.status(404).json({ error: 'No active game for this room' });
    res.json(state);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

app.post('/rooms/:code/game/play', authMiddleware, async (req, res) => {
  const code = req.params.code.toUpperCase();
  const { cardId } = req.body || {};
  if (!cardId) return res.status(400).json({ error: 'cardId is required' });
  try {
    await ensureRoomMembership(code, req.user.sub);
    const personalState = gameManager.playCard(code, req.user.sub, cardId);
    const publicState = gameManager.getState(code);
    if (publicState) {
      io.to(`room:${code}`).emit('game_state', publicState);
    }
    res.json(personalState);
  } catch (err) {
    const mapped = mapGameError(err);
    if (mapped.status >= 500) {
      console.error(err);
      return res.status(500).json({ error: mapped.message });
    }
    return res.status(mapped.status).json({ error: mapped.message });
  }
});

app.post('/rooms/:code/game/leave', authMiddleware, async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    await ensureRoomMembership(code, req.user.sub);
    const publicState = gameManager.leaveGame(code, req.user.sub);
    if (publicState) {
      io.to(`room:${code}`).emit('game_state', publicState);
      io.to(`room:${code}`).emit('player_left', { userId: req.user.sub });
    }
    res.json({ success: true, state: publicState });
  } catch (err) {
    const mapped = mapGameError(err);
    if (mapped.status >= 500) {
      console.error(err);
      return res.status(500).json({ error: mapped.message });
    }
    return res.status(mapped.status).json({ error: mapped.message });
  }
});

// Socket.IO
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.toString().replace('Bearer ', '');
    if (!token) return next(new Error('Unauthorized'));
    const user = jwt.verify(token, JWT_SECRET);
    socket.data.user = user;
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  socket.on('join_room', async ({ code }) => {
    const upper = (code || '').toUpperCase();
    const room = await prisma.room.findUnique({ where: { code: upper } });
    if (!room) {
      socket.emit('error', { error: 'Room not found' });
      return;
    }
    socket.join(`room:${upper}`);
    try {
      await ensureRoomMembership(upper, user.sub);
    } catch (err) {
      socket.emit('error', { error: err.message });
      return;
    }
    const dto = await roomDto(upper);
    socket.emit('room_update', dto);
    const personalState = gameManager.getState(upper, user.sub);
    if (personalState) {
      socket.emit('game_state', personalState);
    }
    socket.to(`room:${upper}`).emit('room_presence', { userId: user.sub, joined: true });
  });

  socket.on('start_game', async ({ code }) => {
    const upper = (code || '').toUpperCase();
    try {
      await startAuthoritativeGame(upper, user.sub);
    } catch (err) {
      socket.emit('game_error', { action: 'start_game', message: err.message });
    }
  });

  socket.on('play_card', async ({ code, cardId }) => {
    const upper = (code || '').toUpperCase();
    if (!cardId) {
      socket.emit('game_error', { action: 'play_card', message: 'cardId is required' });
      return;
    }
    try {
      const personalState = gameManager.playCard(upper, user.sub, cardId);
      socket.emit('game_state', personalState);
      
      // Send personal states to all players
      const socketsInRoom = await io.in(`room:${upper}`).fetchSockets();
      for (const sock of socketsInRoom) {
        const userId = sock.data.user?.sub;
        if (userId && userId !== user.sub) {
          const state = gameManager.getState(upper, userId);
          if (state) {
            sock.emit('game_state', state);
          }
        }
      }
    } catch (err) {
      const mapped = mapGameError(err);
      socket.emit('game_error', { action: 'play_card', message: mapped.message });
    }
  });

  socket.on('leave_game', ({ code }) => {
    const upper = (code || '').toUpperCase();
    try {
      const publicState = gameManager.leaveGame(upper, user.sub);
      if (publicState) {
        io.to(`room:${upper}`).emit('game_state', publicState);
        io.to(`room:${upper}`).emit('player_left', { userId: user.sub });
      }
      socket.emit('left_game', { success: true });
    } catch (err) {
      const mapped = mapGameError(err);
      socket.emit('game_error', { action: 'leave_game', message: mapped.message });
    }
  });

  // Handle timeout - skip turn when timer expires
  socket.on('timeout', async ({ code }) => {
    const upper = (code || '').toUpperCase();
    try {
      const state = gameManager.getState(upper);
      if (!state || (state.status !== 'playing' && state.status !== 'shootout')) return;
      
      // Only process if it's actually this user's turn
      if (state.currentTurnPlayerId !== user.sub) return;
      
      // Skip to next player
      gameManager.skipTurn(upper, user.sub);
      
      // Send updated states to all players
      const socketsInRoom = await io.in(`room:${upper}`).fetchSockets();
      for (const sock of socketsInRoom) {
        const userId = sock.data.user?.sub;
        if (userId) {
          const personalState = gameManager.getState(upper, userId);
          if (personalState) {
            sock.emit('game_state', personalState);
          }
        }
      }
    } catch (err) {
      console.error('[timeout] Error:', err.message);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

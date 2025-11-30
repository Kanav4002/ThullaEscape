## Backend (Express + Prisma + Socket.IO)

Authoritative Thulla Escape game server with full Punjabi card game rules:

- **Auth**: Register/login with bcrypt + JWT, `/me` read/update keeps room rosters in sync.
- **Rooms**: Create, join, fetch, and owner-only `start` actions with 6-char invite codes.
- **Realtime**: Socket.IO rooms keyed by `room:{code}` broadcast lobby updates, presence, and `game_state` snapshots.
- **Game engine**: Full Thulla Escape rules implementation:
  - 1-2 deck support (3-6 players = 1 deck, 7-8 = 2 decks)
  - Ace of Spades starts in center, first trick always spades (discarded, no winner)
  - Follow-suit enforcement with thulla (off-suit) detection
  - Power holder mechanics: highest lead suit card wins trick
  - Thulla triggers immediate trick end, winner picks up all cards
  - Power block: can't finish with power, must draw from waste pile
  - Shootout mode for final 2 players
  - Leave game functionality with card redistribution
- **Persistence**: Prisma + SQLite schema for `User` (with level), `Room`, `RoomPlayer`, plus migrations.

### Getting started

```bash
cd backend
npm install
npx prisma migrate dev   # ensures dev.db matches schema
npm run dev              # starts Express on :4000
```

Create `.env` with `DATABASE_URL="file:./prisma/dev.db"`, `JWT_SECRET`, `PORT=4000`.

### Key endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register`, `/auth/login` | Email/password auth, returns JWT |
| `GET/PUT` | `/me` | Profile read/update (propagates to active rooms) |
| `POST` | `/rooms` | Create room + auto-join as owner |
| `POST` | `/rooms/join` | Join existing lobby before it starts |
| `GET` | `/rooms/:code` | Lobby snapshot (players, status) |
| `POST` | `/rooms/:code/start` | Owner triggers server-side game (3-8 players) |
| `GET` | `/rooms/:code/game` | Player-scoped authoritative state (includes your hand) |
| `POST` | `/rooms/:code/game/play` | Submit a card; validates turn/suit/thulla and broadcasts |
| `POST` | `/rooms/:code/game/leave` | Leave active game, cards go to waste pile |

### Socket events

**Client → Server:**
- `join_room({ code })` - Join socket room, get current state
- `start_game({ code })` - Owner starts game
- `play_card({ code, cardId })` - Play a card from hand
- `leave_game({ code })` - Leave active game

**Server → Client:**
- `room_update(dto)` - Lobby player list changed
- `room_presence({ userId, joined })` - Player joined/left socket
- `game_start(dto)` - Game started
- `game_state(state)` - Authoritative game state (includes your hand if viewer)
- `player_left({ userId })` - Player left game
- `game_error({ action, message })` - Validation error

### Game rules enforced

✅ 3-8 player requirement  
✅ First trick: all players play spades, discarded (no winner)  
✅ Follow suit if possible, else thulla (off-suit)  
✅ Thulla ends trick immediately, highest lead suit picks up all cards  
✅ Complete trick: highest lead suit gets power, leads next  
✅ Power block: can't finish holding power, draw from waste  
✅ Shootout: 2 players left, special rules  
✅ Finish order tracking for scoring  
✅ Leave game: cards to waste, turn advances  

### Next steps

- Timer enforcement (auto-play/skip on timeout)
- Steal mechanic (power holder steals from another player)
- Persistent game snapshots for reconnection
- Analytics endpoints (win rate, thulla stats per player)
- Rate limiting and CI/tests + Docker Compose


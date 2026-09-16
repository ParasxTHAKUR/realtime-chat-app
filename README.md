# Real-Time Chat Application

A full-stack real-time chat application with instant messaging, JWT authentication, and live presence tracking — built with the MERN stack and Socket.io.

**Live demo:** `https://your-app.vercel.app` _(replace with your actual Vercel URL)_
**Backend API:** `https://realtime-chat-app-5-0bnv.onrender.com`

> Note: the backend is hosted on Render's free tier, which spins down after inactivity. The first request after a period of no traffic may take 30–50 seconds to respond while the server wakes up.

---

## Features

- **Authentication** — secure registration and login with JWT, passwords hashed with bcrypt
- **Real-time messaging** — instant delivery via WebSockets (Socket.io), no polling or manual refresh
- **Persistent history** — every message is stored in MongoDB and reloaded on reconnect
- **Offline delivery** — messages sent to an offline user are saved and delivered on their next login
- **Live presence** — online/offline status broadcast to all connected users in real time
- **Typing indicators** — debounced "user is typing..." signal between conversation participants
- **Protected routes** — both REST endpoints and WebSocket connections require a valid JWT

## Tech Stack

**Backend**

- Node.js / Express.js
- Socket.io (WebSocket server)
- MongoDB with Mongoose (via MongoDB Atlas)
- JWT for authentication, bcrypt for password hashing

**Frontend**

- React (Vite)
- React Router for client-side routing
- Context API for global auth and socket state
- Axios for REST requests
- socket.io-client for the WebSocket connection

**Deployment**

- Backend: Render
- Frontend: Vercel
- Database: MongoDB Atlas

## Architecture

```
Client (React)                Server (Express + Socket.io)         Database
─────────────                 ─────────────────────────            ────────
Login/Register  ──HTTP──────▶ /api/auth (JWT issued)
Contact List    ──HTTP──────▶ /api/users (protected)         ◀───▶ MongoDB
Chat History    ──HTTP──────▶ /api/messages/:userId (protected)     (Users,
Live Messaging  ──WebSocket─▶ Socket.io (JWT handshake auth)         Messages)
                ◀─WebSocket── receiveMessage / userTyping /
                              userOnline / userOffline
```

- REST endpoints handle authentication, fetching the contact list, and loading conversation history.
- A single authenticated WebSocket connection (established once per session via a JWT handshake) handles all real-time events: sending/receiving messages, typing indicators, and online/offline presence.
- An in-memory map on the server tracks which user ID is connected to which socket, enabling messages to be routed to a specific recipient rather than broadcast to everyone.

## Key Engineering Decisions

- **Dual authentication paths**: JWTs are verified both as an Express middleware (for REST routes) and as a Socket.io middleware (for the WebSocket handshake), since WebSocket connections don't carry per-request headers the way HTTP does.
- **Save-then-deliver messaging**: every message is persisted to MongoDB _before_ attempting live delivery, so messages to offline users are never lost — they're simply retrieved via the history endpoint on the recipient's next login.
- **Presence sync on connect**: in addition to broadcasting `userOnline`/`userOffline` events on connect/disconnect, each newly connected client receives a full snapshot of currently-online users, avoiding a race condition where a client could miss the "online" status of users who connected before it did.
- **Context-based socket management**: a single WebSocket connection is created per session (via React Context) and shared across all components, rather than each component managing its own connection.

## Running Locally

**Prerequisites:** Node.js (v20+), a MongoDB Atlas connection string (or local MongoDB instance)

**Backend**

```bash
npm install
```

`.env` in the project root:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret
JWT_EXPIRES_IN=7d
```

```bash
npm run dev
```

Runs on `http://localhost:5000`.

**Frontend**

```bash
cd client
npm install
```

`client/.env`:

```
VITE_API_URL= http://localhost:5000
```

```bash
npm run dev
```

Runs on `http://localhost:5173`.

## Possible Future Improvements

- Group chat / chat rooms
- Message read receipts
- Image/file sharing in messages
- Push notifications
- Redis-backed presence tracking for multi-server scaling

Here are 10 questions genuinely likely to come up, given what you actually built — with a note on what each is really probing for.

1. "Walk me through what happens, end to end, when User A sends a message to User B."
   This is the classic "explain your architecture" opener. You should be able to trace: socket emits sendMessage → server saves to MongoDB → server checks the onlineUsers map → emits receiveMessage to both sender (echo) and receiver (if online).

2. "How did you handle authentication for the WebSocket connections? Isn't that different from normal REST auth?"
   This tests whether you understand why Socket.io needs its own middleware (io.use(socketAuth)) — because there's no Authorization header on a WebSocket handshake the way there is on an HTTP request, so the token has to be sent via socket.handshake.auth instead.

3. "What happens if you send a message to a user who's offline? Does it get lost?"
   Your answer: no — messages are saved to MongoDB before attempting live delivery, so it's retrieved via the history endpoint whenever they reconnect. Good chance to mention the deliberate "save-then-deliver" ordering.

4. "How do you track which users are currently online?"
   Explain the in-memory Map (userId → socketId), and — this is a good one to bring up unprompted — the presence-sync bug you actually hit and fixed: relying only on userOnline/userOffline broadcasts missed anyone who connected before you did, so you added a full snapshot (onlineUsersList) sent to each new connection. This is a great real debugging story to tell.

5. "Why did you use Context instead of just passing props down, or a state library like Redux?"
   Tests React fundamentals. Context solves prop-drilling for cross-cutting concerns (auth, socket) that many unrelated components need; Redux would be overkill for a project this size — a fair, honest answer, not "Redux is bad."

6. "How would this app handle scaling to multiple servers?"
   Honest answer: it currently wouldn't cleanly — the onlineUsers map is in-memory, per-server, so two servers wouldn't know about each other's connected users. The fix would be a shared store like Redis for presence/session data. Naming this limitation yourself shows maturity.

7. "Why hash passwords with bcrypt specifically, instead of something like SHA-256?"
   bcrypt is intentionally slow and includes automatic salting, defeating rainbow-table attacks and brute-forcing — SHA-256 is fast (designed for speed), which is actually bad for password hashing specifically.

8. "What's stored in the JWT, and is that data secure?"
   JWT payloads are base64-encoded, not encrypted — readable by anyone, not just your server. Security comes from the signature (verified with your secret), not secrecy of contents. That's why you never put sensitive data (passwords) inside the payload itself.

9. "How did you prevent a logged-out or unauthorized user from accessing the chat routes?"
   Two layers: protect middleware on REST routes (checks the Bearer token), and React Router's conditional redirects (user ? <ChatPage /> : <Navigate to="/login" />) on the frontend — good chance to note the frontend check is UX-only, not real security; the backend middleware is what actually enforces it.

10. "What was the hardest bug you ran into, and how did you debug it?"
    Genuinely yours to pick from real experience — the token/window identity mix-up during multi-user testing, the useRef-during-render React error, or the presence-sync race condition are all strong, specific answers that show real debugging process rather than a rehearsed one.

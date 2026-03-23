import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import cors from 'cors';
import { initDb } from './db.js';
import { authRouter } from './routes/auth.js';
import { channelRouter } from './routes/channels.js';
import { messageRouter } from './routes/messages.js';
import { setupSocket } from './socket.js';

const app = express();
const httpServer = createServer(app);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'magic-broom-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
});

app.use(cors({ origin: 'http://localhost:5576', credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

const db = initDb();
app.locals.db = db;

app.use('/api/auth', authRouter);
app.use('/api/channels', channelRouter);
app.use('/api/messages', messageRouter);

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5576', credentials: true },
});

io.engine.use(sessionMiddleware);
setupSocket(io, db);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const onlineUsers = new Map(); // userId -> { socketId, username, displayName, status }

export function setupSocket(io, db) {
  io.use((socket, next) => {
    const session = socket.request.session;
    if (!session?.userId) {
      return next(new Error('Not authenticated'));
    }
    socket.userId = session.userId;
    next();
  });

  io.on('connection', (socket) => {
    const user = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(
      socket.userId
    );
    if (!user) return socket.disconnect();

    // Track presence
    onlineUsers.set(user.id, {
      socketId: socket.id,
      username: user.username,
      displayName: user.display_name,
      status: 'online',
    });
    io.emit('presence:update', Object.fromEntries(onlineUsers));

    // Join all channels the user is a member of
    const channels = db.prepare(
      'SELECT channel_id FROM channel_members WHERE user_id = ?'
    ).all(user.id);
    for (const { channel_id } of channels) {
      socket.join(`channel:${channel_id}`);
    }

    // Handle messages
    socket.on('message:send', ({ channelId, content }) => {
      if (!content?.trim()) return;

      const result = db.prepare(
        'INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)'
      ).run(channelId, user.id, content.trim());

      const message = db.prepare(`
        SELECT m.*, u.username, u.display_name
        FROM messages m JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

      io.to(`channel:${channelId}`).emit('message:new', message);
    });

    // Join/leave channels
    socket.on('channel:join', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('channel:leave', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // Presence: idle
    socket.on('presence:idle', () => {
      const entry = onlineUsers.get(user.id);
      if (entry) {
        entry.status = 'idle';
        io.emit('presence:update', Object.fromEntries(onlineUsers));
      }
    });

    socket.on('presence:active', () => {
      const entry = onlineUsers.get(user.id);
      if (entry) {
        entry.status = 'online';
        io.emit('presence:update', Object.fromEntries(onlineUsers));
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(user.id);
      io.emit('presence:update', Object.fromEntries(onlineUsers));
    });
  });
}

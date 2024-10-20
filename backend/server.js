const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
  },
});
// Middleware
app.use(cors());
app.use(express.json());

const rooms = {}; // Store room details { roomId: { users: [], code: '' } }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle joining a room
  socket.on('join-room', ({ username, roomCode }) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { users: [], code: '// Start coding here...' }; // Initialize room with empty code
    }

    rooms[roomCode].users.push({ id: socket.id, username });
    socket.join(roomCode);

    // Notify all users in the room about the new user
    io.in(roomCode).emit('user-list', rooms[roomCode].users.map(user => user.username));
    io.in(roomCode).emit('message', { username: 'System', message: `${username} has joined the room.` });

    // Send existing code to the new user
    socket.emit('code-update', rooms[roomCode].code);
  });

  // Handle code changes and broadcast to others in the room
  socket.on('code-change', ({ roomCode, code }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].code = code; // Save the code in the room state
      io.in(roomCode).emit('code-update', code); // Broadcast code update to all users (including sender)
    } else {
      console.log(`Room ${roomCode} not found for code change.`);
    }
  });

  // Handle new chat messages
  socket.on('message', ({ username, message }) => {
    const roomCode = Object.keys(rooms).find(room => rooms[room].users.some(user => user.id === socket.id));
    if (roomCode) {
      io.in(roomCode).emit('message', { username, message });
    } else {
      console.log(`Room not found for message from user ${username}.`);
    }
  });

  // Handle user leaving the room
  socket.on('leave-room', ({ username, roomCode }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].users = rooms[roomCode].users.filter(user => user.id !== socket.id);
      socket.leave(roomCode);

      // Notify others in the room
      io.in(roomCode).emit('user-list', rooms[roomCode].users.map(user => user.username));
      io.in(roomCode).emit('message', { username: 'System', message: `${username} has left the room.` });

      // Delete room if empty
      if (rooms[roomCode].users.length === 0) {
        delete rooms[roomCode];
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    let roomCode;
    let username;
    for (const room in rooms) {
      const user = rooms[room].users.find(user => user.id === socket.id);
      if (user) {
        roomCode = room;
        username = user.username;
        rooms[room].users = rooms[room].users.filter(user => user.id !== socket.id);
        break;
      }
    }

    if (roomCode && username) {
      io.in(roomCode).emit('user-list', rooms[roomCode].users.map(user => user.username));
      io.in(roomCode).emit('message', { username: 'System', message: `${username} has disconnected.` });

      // Delete room if empty
      if (rooms[roomCode].users.length === 0) {
        delete rooms[roomCode];
      }
    } else {
      console.log(`User with ID ${socket.id} disconnected without being in any room.`);
    }
    console.log('A user disconnected:', socket.id);
  });
});

// Serve static files or frontend (if applicable)
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start the server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

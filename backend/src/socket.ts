import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './config/config';
import pool from './database';
import logger from './utils/logger';

let io: Server;

// Store connected users mapping for debugging/tracking if needed
const connectedUsers = new Map<string, string>(); // socketId -> userId

// Parse the same CORS origins as app.ts (comma-separated)
const socketCorsOrigins = config.server.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (socketCorsOrigins.includes(origin)) return callback(null, true);
        if (config.isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        logger.warn(`Socket.io CORS blocked origin: ${origin}`);
        callback(new Error(`CORS: origin ${origin} is not allowed`));
      },
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as { id: string; role: string };
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user;
    connectedUsers.set(socket.id, user.id);

    logger.info(`Socket connected: ${socket.id}`, { userId: user.id, role: user.role });

    // Join room based on role
    if (user.role === 'customer') {
      socket.join(`user_${user.id}`);
      logger.info(`Customer joined room: user_${user.id}`, { socketId: socket.id });
    } else if (user.role === 'owner') {
      // Find the restaurant owned by this owner to join its room
      try {
        const result = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [user.id]);
        if (result.rows.length > 0) {
          const restaurantId = result.rows[0].id;
          socket.join(`restaurant_${restaurantId}`);
          logger.info(`Owner joined room: restaurant_${restaurantId}`, {
            socketId: socket.id,
            userId: user.id,
          });
        }
      } catch (err) {
        logger.error(`Socket error fetching restaurant for owner`, {
          userId: user.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

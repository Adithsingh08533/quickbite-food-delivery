FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Copy migration files for production migrations
COPY --from=builder /app/src/database/migrations ./dist/database/migrations

# Expose the API port
EXPOSE 5000

# Start the application with migrations
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/server.js"]

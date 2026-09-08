# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Run the build (Vite + esbuild)
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/*.traineddata ./

# Ensure data directory and app files are writable by node user
RUN mkdir -p /data && chown -R node:node /app /data

# Run as unprivileged node user
USER node

# Expose the port
EXPOSE 3000

# Use the production start command
CMD ["node", "dist/server.cjs"]

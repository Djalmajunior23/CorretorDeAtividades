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

# Copy production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist
# Also copy any other needed files if server.ts needs them at runtime
# (server.ts bundle excludes external packages but resolves relative imports)

# Expose the port
EXPOSE 8080

# Use the production start command
CMD ["node", "dist/server.cjs"]

# Use Node.js 18
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages
COPY packages/ ./packages/

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including workspace dependencies)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build workspace dependencies in correct order (based on dependency graph)
RUN pnpm --filter @coldtrace/env build
RUN pnpm --filter @coldtrace/logger build
RUN pnpm --filter @coldtrace/database build
RUN pnpm --filter @coldtrace/types build

# Build backend using pnpm (not npm)
RUN cd apps/backend && pnpm run generate && pnpm run build

# Expose port
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start the backend
WORKDIR /app/apps/backend
CMD ["node", "dist/index.js"]

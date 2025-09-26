# Use Node.js 18
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages (not just package.json files)
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (use --no-frozen-lockfile for Railway)
RUN pnpm install --no-frozen-lockfile

# Copy remaining source code
COPY . .

# Build the project
RUN pnpm build

# Expose port
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start the backend
WORKDIR /app/apps/backend
CMD ["node", "dist/index.js"]

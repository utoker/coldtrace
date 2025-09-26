import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getAllowedOrigins } from '@coldtrace/env';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { createContext, GraphQLContext } from './graphql/context.js';

// Configuration
const SERVER_CONFIG = {
  PORT: Number(process.env.PORT || 4000),
  ALLOWED_ORIGINS: getAllowedOrigins([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://coldtrace-frontend.vercel.app',
    'https://coldtrace.app',
    'https://www.coldtrace.app',
  ]),
} as const;

async function startServer() {
  const { PORT, ALLOWED_ORIGINS } = SERVER_CONFIG;
  
  // Debug: Log allowed origins
  console.log('🔧 Allowed origins:', ALLOWED_ORIGINS);

  // Create Express app
  const app = express();

  // Add JSON parsing middleware (required for GraphQL requests)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Create HTTP server (will handle both HTTP and WebSocket)
  const httpServer = createServer(app);

  // Build executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Create WebSocket server on same port
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
    verifyClient: (info: any) => {
      const origin = info.origin;
      // In production, require a valid origin; in dev, allow missing origin for local tools
      const isAllowed = origin
        ? ALLOWED_ORIGINS.includes(origin)
        : process.env.NODE_ENV !== 'production';
      
      // Enhanced debugging for origin validation
      console.log(`🔌 WebSocket origin check: "${origin}" in [${ALLOWED_ORIGINS.join(', ')}] = ${isAllowed}`);
      
      if (!isAllowed) {
        console.log(
          `🔌 WebSocket connection rejected from origin: ${origin || 'unknown'}`
        );
        return false;
      }
      console.log(
        `🔌 WebSocket connection accepted from origin: ${origin || 'unknown'}`
      );
      return true;
    },
  });

  // Create GraphQL WebSocket server
  const serverCleanup = useServer(
    {
      schema,
      context: async () => {
        // Create context for WebSocket connections
        return createContext();
      },
      onConnect: async () => {
        console.log('🔌 WebSocket client connected');
      },
      onDisconnect: (_, code, reason) => {
        console.log(
          `🔌 WebSocket client disconnected: ${code} ${
            reason?.toString() || 'unknown'
          }`
        );
      },
      onError: (_, msg, errors) => {
        console.error('🔌 WebSocket error:', msg, errors);
      },
    },
    wsServer
  );

  // Create Apollo Server instance
  const server = new ApolloServer<GraphQLContext>({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
    csrfPrevention: {
      requestHeaders: [
        'content-type',
        'x-apollo-operation-name',
        'apollo-require-preflight',
      ],
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // Start Apollo Server
  await server.start();

  // Add logging middleware (only non-GraphQL requests)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url !== '/graphql') {
      console.log(
        `📡 ${req.method} ${req.url} from ${req.get('origin') || 'unknown'}`
      );
    }
    next();
  });

  // Apply middleware with consistent origin configuration
  app.use(
    '/graphql',
    cors({
      origin: (origin, callback) => {
        // Allow requests without Origin (SSR, server-to-server, health checks)
        if (!origin) {
          console.log('🌐 CORS: Allowing request without origin');
          return callback(null, true);
        }
        
        const isAllowed = ALLOWED_ORIGINS.includes(origin);
        console.log(`🌐 CORS origin check: "${origin}" in [${ALLOWED_ORIGINS.join(', ')}] = ${isAllowed}`);
        
        if (isAllowed) {
          return callback(null, true);
        }
        
        console.log(`🌐 CORS: Rejecting origin: ${origin}`);
        // Deny with no error to avoid opaque network failures in browsers
        return callback(null, false);
      },
      credentials: true,
    }),
    expressMiddleware(server, {
      context: async () => {
        return createContext();
      },
    })
  );

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  httpServer.listen(PORT, () => {
    console.log(
      `🚀 GraphQL HTTP Server ready at: http://localhost:${PORT}/graphql`
    );
    console.log(
      `🔌 GraphQL WebSocket Server ready at: ws://localhost:${PORT}/graphql`
    );
    console.log(
      `🏥 Health check available at: http://localhost:${PORT}/health`
    );
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 GraphQL Playground available in development mode`);
    }
    console.log(`📊 Enhanced WebSocket logging enabled`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

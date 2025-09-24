import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { parse } from 'graphql';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getAllowedOrigins } from '@coldtrace/env';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext, GraphQLContext } from './graphql/context';

// Configuration
const SERVER_CONFIG = {
  PORT: Number(process.env.PORT || 4000),
  ALLOWED_ORIGINS: getAllowedOrigins([
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ]),
} as const;

async function startServer() {
  const { PORT, ALLOWED_ORIGINS } = SERVER_CONFIG;

  // Create Express app
  const app = express();

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
      if (!isAllowed) {
        console.log(`❌ WebSocket connection rejected from origin: ${origin}`);
      }
      return isAllowed;
    },
  });

  // Set up GraphQL WebSocket server using useServer
  const serverCleanup = useServer(
    {
      schema,
      context: async (_ctx: any) => await createContext(),
      onConnect: async (_ctx: any) => {
        console.log('🔌 GraphQL-WS Client connected');
        return true; // Allow all connections
      },
      onDisconnect: (_ctx: any, code?: number, reason?: string) => {
        if (code && code !== 1000) {
          // Only log abnormal disconnections
          console.log(`🔌 GraphQL-WS Client disconnected (${code}: ${reason})`);
        }
      },
      onSubscribe: async (_ctx: any, _id: string, payload: any) => {
        // Parse the query string to GraphQL document
        let document;
        try {
          document = parse(payload.query);
        } catch (error) {
          console.error('❌ Error parsing GraphQL query:', error);
          throw error;
        }

        // Return the standard GraphQL execution args
        return {
          schema,
          operationName: payload.operationName || undefined,
          document,
          variableValues: payload.variables || {},
          contextValue: await createContext(),
        };
      },
      onError: (
        _ctx: any,
        _id: string,
        _payload: any,
        errors: readonly Error[]
      ) => {
        console.error(
          '❌ GraphQL WebSocket subscription error:',
          errors.map((e) => e.message)
        );
      },
    },
    wsServer
  );

  // Create Apollo Server instance
  const server = new ApolloServer<GraphQLContext>({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
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
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        // Deny with no error to avoid opaque network failures in browsers
        return callback(null, false);
      },
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      websocket: 'enabled',
    });
  });

  // Start server on single port
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
    console.log(`🔍 GraphQL Playground available in development mode`);
    console.log(`📊 Enhanced WebSocket logging enabled`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('🛑 Shutting down servers...');
    await serverCleanup.dispose();
    httpServer.close();
    await server.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

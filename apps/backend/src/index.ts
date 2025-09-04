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
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext, GraphQLContext } from './graphql/context';

async function startServer() {
  const PORT = 4000;

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
      // Allow connections from frontend development servers
      const origin = info.origin;
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ];
      
      console.log(`🔍 WebSocket connection attempt from origin: ${origin}`);
      
      if (!origin || allowedOrigins.includes(origin)) {
        console.log('✅ WebSocket connection allowed');
        return true;
      }
      
      console.log('❌ WebSocket connection rejected - invalid origin');
      return false;
    },
  });

  // Set up GraphQL WebSocket server using useServer (much simpler!)
  const serverCleanup = useServer(
    {
      schema,
      context: async (_ctx: any) => {
        console.log('📡 Creating GraphQL WebSocket context');
        return await createContext();
      },
      onConnect: async (ctx: any) => {
        console.log('🔌 GraphQL-WS Client connected successfully');
        console.log('   - Connection params:', ctx.connectionParams);
        console.log('   - Protocol:', ctx.extra?.socket?.protocol);
        console.log('   - URL:', ctx.extra?.request?.url);
        return true; // Allow all connections
      },
      onDisconnect: (_ctx: any, code?: number, reason?: string) => {
        console.log('🔌 GraphQL-WS Client disconnected');
        console.log('   - Code:', code);
        console.log('   - Reason:', reason);
      },
      onSubscribe: async (_ctx: any, _id: string, payload: any) => {
        console.log('📡 GraphQL subscription started');
        console.log('   - Message ID:', _id);
        console.log('   - Payload:', JSON.stringify(payload));
        
        // Parse the query string to GraphQL document
        let document;
        try {
          document = parse(payload.query);
          console.log('   - Document parsed successfully');
        } catch (error) {
          console.error('   - Error parsing query:', error);
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
      onError: (_ctx: any, _id: string, _payload: any, errors: readonly Error[]) => {
        console.error('❌ GraphQL WebSocket subscription error:', errors);
      },
      onComplete: (_ctx: any, id: string) => {
        console.log('✅ GraphQL subscription completed:', id);
      },
    },
    wsServer
  );

  // Create Apollo Server instance
  const server = new ApolloServer<GraphQLContext>({
    schema,
    introspection: true,
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

  // Add logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`📡 ${req.method} ${req.url} from ${req.get('origin') || 'unknown'}`);
    next();
  });

  // Apply middleware
  app.use(
    '/graphql',
    cors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
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
      websocket: 'enabled' 
    });
  });

  // Start server on single port
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL HTTP Server ready at: http://localhost:${PORT}/graphql`);
    console.log(`🔌 GraphQL WebSocket Server ready at: ws://localhost:${PORT}/graphql`);
    console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
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
import { ApolloClient, InMemoryCache, ApolloLink } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// Create InMemoryCache configuration
const createCache = () =>
  new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getDevices: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
          getDeviceReadings: {
            keyArgs: ['deviceId'],
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
      Device: {
        fields: {
          readings: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
          alerts: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  });

// Create HTTP Link factory
const createHttpLinkClient = () => {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  if (process.env.NODE_ENV === 'production') {
    if (!endpoint) {
      throw new Error('NEXT_PUBLIC_GRAPHQL_ENDPOINT must be set in production');
    }
  }
  return new HttpLink({
    uri: endpoint || 'http://localhost:4000/graphql',
  });
};

// Create WebSocket Link factory (client-side only)
const createWebSocketLink = (): GraphQLWsLink | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const wsUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT ||
    (process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
      ? process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT.replace('http', 'ws')
      : 'ws://localhost:4000/graphql');
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT
  ) {
    // In production, do not attempt WS with localhost fallback
    return null;
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔌 Creating WebSocket client with URL:', wsUrl);
    }

    // Test WebSocket connection before creating GraphQL client
    if (typeof window !== 'undefined') {
      try {
        const testWs = new WebSocket(wsUrl);
        testWs.onopen = () => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ WebSocket test connection successful');
          }
          testWs.close();
        };
        testWs.onerror = (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('❌ WebSocket test connection failed:', error);
          }
        };
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Failed to create test WebSocket:', error);
        }
      }
    }

    const wsClient = createClient({
      url: wsUrl,
      connectionParams: {
        // Add authentication headers if needed
      },
      shouldRetry: (errorsOrCloseEvent) => {
        // Retry on connection errors and specific close events
        if (errorsOrCloseEvent instanceof CloseEvent) {
          // Retry on most connection-related close codes
          return (
            errorsOrCloseEvent.code === 1001 || // Going away (server restart)
            errorsOrCloseEvent.code === 1006 || // Abnormal closure
            errorsOrCloseEvent.code === 1011 || // Unexpected condition
            errorsOrCloseEvent.code === 1012 || // Service restart
            errorsOrCloseEvent.code === 1013 // Try again later
          );
        }
        return true;
      },
      retryAttempts: 5,
      retryWait: async (attempt) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(30000, Math.pow(2, attempt) * 1000))
        );
      },
      on: {
        connected: (_socket, _payload) => {
          // Store connection status globally for UI to access
          if (typeof window !== 'undefined') {
            window.__GRAPHQL_WS_CONNECTED__ = true;
            window.dispatchEvent(new CustomEvent('graphql-ws-connected'));
          }
        },
        error: (error: unknown) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('❌ GraphQL WebSocket error:', {
              error,
              errorType: typeof error,
              errorConstructor: error?.constructor?.name,
              message: error instanceof Error ? error.message : String(error),
              name: error instanceof Error ? error.name : 'WebSocketError',
              stack: error instanceof Error ? error.stack : undefined,
              details: error,
            });
          }
          if (typeof window !== 'undefined') {
            window.__GRAPHQL_WS_CONNECTED__ = false;
            window.dispatchEvent(
              new CustomEvent('graphql-ws-error', {
                detail: {
                  message: (error as any)?.message || 'Unknown WebSocket error',
                  name: (error as any)?.name || 'WebSocketError',
                  originalError: error,
                },
              })
            );
          }
        },
        closed: (event: unknown) => {
          const closeEvent = event as CloseEvent;
          if (process.env.NODE_ENV !== 'production') {
            console.warn('🔌 GraphQL WebSocket closed', {
              code: closeEvent.code,
              reason: closeEvent.reason,
              wasClean: closeEvent.wasClean,
            });
          }
          if (typeof window !== 'undefined') {
            window.__GRAPHQL_WS_CONNECTED__ = false;
            window.dispatchEvent(
              new CustomEvent('graphql-ws-closed', { detail: event })
            );
          }
        },
        connecting: () => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔌 WebSocket: Connecting to GraphQL server...');
          }
        },
      },
    });

    const wsLink = new GraphQLWsLink(wsClient);
    return wsLink;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ WebSocket: Failed to create WebSocket link:', error);
    }
    return null;
  }
};

// Create the split link
const createSplitLink = (): ApolloLink => {
  const httpLink = createHttpLinkClient();
  const wsLink = createWebSocketLink();

  // If WebSocket is not available (SSR or creation failed), use HTTP only
  if (!wsLink) {
    return httpLink;
  }

  // Split based on operation type
  return ApolloLink.split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink
  );
};

// Apollo Client factory function
export const createApolloClient = () => {
  const splitLink = createSplitLink();
  const cache = createCache();

  const client = new ApolloClient({
    link: ApolloLink.from([splitLink]),
    cache,
    // SSR configuration
    ssrMode: typeof window === 'undefined',
    // Default options for queries
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
      },
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
      },
    },
  });

  return client;
};

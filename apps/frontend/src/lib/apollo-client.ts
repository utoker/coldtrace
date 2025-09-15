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
const createHttpLinkClient = () =>
  new HttpLink({
    uri:
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
      'http://localhost:4000/graphql',
  });

// Create WebSocket Link factory (client-side only)
const createWebSocketLink = (): GraphQLWsLink | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const wsUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT ||
    'ws://localhost:4000/graphql';

  try {
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
          const errorObj = error as Error;
          console.error('❌ GraphQL WebSocket error:', {
            message: errorObj?.message || 'Unknown error',
            name: errorObj?.name || 'WebSocketError',
            stack: errorObj?.stack,
            details: error,
          });
          if (typeof window !== 'undefined') {
            window.__GRAPHQL_WS_CONNECTED__ = false;
            window.dispatchEvent(
              new CustomEvent('graphql-ws-error', {
                detail: {
                  message: errorObj?.message || 'Unknown WebSocket error',
                  name: errorObj?.name || 'WebSocketError',
                  originalError: error,
                },
              })
            );
          }
        },
        closed: (event: unknown) => {
          const closeEvent = event as CloseEvent;
          console.warn('🔌 GraphQL WebSocket closed', {
            code: closeEvent.code,
            reason: closeEvent.reason,
            wasClean: closeEvent.wasClean,
          });
          if (typeof window !== 'undefined') {
            window.__GRAPHQL_WS_CONNECTED__ = false;
            window.dispatchEvent(
              new CustomEvent('graphql-ws-closed', { detail: event })
            );
          }
        },
        connecting: () => {
          // Connection in progress
        },
      },
    });

    const wsLink = new GraphQLWsLink(wsClient);
    return wsLink;
  } catch (error) {
    console.error('❌ WebSocket: Failed to create WebSocket link:', error);
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

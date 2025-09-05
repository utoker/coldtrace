'use client';

import { useEffect } from 'react';
import { useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useWebSocket } from '@/contexts/WebSocketContext';

const PING_SUBSCRIPTION = gql`
  subscription PingTest {
    ping
  }
`;

interface PingData {
  ping: string;
}

export function WebSocketTest() {
  const wsContext = useWebSocket();

  // Force a subscription to test WebSocket connection
  const { data, error, loading } = useSubscription<PingData>(
    PING_SUBSCRIPTION,
    {
      onData: ({ data: subscriptionData }) => {},
      onError: (error) => {
        console.error('❌ WebSocketTest: Subscription error:', error);
      },
    }
  );

  useEffect(() => {
    // WebSocket connection monitoring
  }, [loading, error, data, wsContext]);

  const getStatusColor = () => {
    if (wsContext.connectionState === 'connected') return 'bg-green-800';
    if (wsContext.connectionState === 'connecting') return 'bg-yellow-800';
    if (wsContext.connectionState === 'error') return 'bg-red-800';
    return 'bg-gray-800';
  };

  return (
    <div
      className={`fixed bottom-4 right-4 ${getStatusColor()} text-white p-3 rounded-lg text-sm max-w-xs`}
    >
      <h4 className="font-semibold mb-2">WebSocket Status</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Connection:</span>
          <span
            className={
              wsContext.isConnected ? 'text-green-300' : 'text-red-300'
            }
          >
            {wsContext.connectionState.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Subscription:</span>
          <span>
            {loading
              ? 'Loading...'
              : error
              ? 'Error'
              : data
              ? 'Receiving'
              : 'Inactive'}
          </span>
        </div>
        {wsContext.lastConnected && (
          <div className="text-gray-300">
            Connected: {wsContext.lastConnected.toLocaleTimeString()}
          </div>
        )}
        {wsContext.error && (
          <div className="text-red-300 break-words">
            Error: {wsContext.error}
          </div>
        )}
        {data && (
          <div className="text-green-300 break-words">
            Last ping: {data.ping?.substring(0, 50)}...
          </div>
        )}
        {wsContext.retryCount > 0 && (
          <div className="text-yellow-300">Retries: {wsContext.retryCount}</div>
        )}
      </div>
    </div>
  );
}

/**
 * WebSocket client that sends an Origin header for backend verifyClient.
 * In production, the backend rejects connections with no Origin; Node's ws
 * doesn't send Origin by default. Use this so stress-test works against production.
 */
import WebSocket from 'ws';

const DEFAULT_ORIGIN = 'https://coldtrace.app';

export class WebSocketWithOrigin extends WebSocket {
  constructor(
    url: string,
    protocols?: string | string[],
    options?: Record<string, unknown>
  ) {
    const o = options && typeof options === 'object' ? options : {};
    const headers = {
      ...((o.headers as Record<string, string>) || {}),
      Origin: process.env.GRAPHQL_WS_ORIGIN || DEFAULT_ORIGIN,
    };
    super(url, protocols as string | string[] | undefined, { ...o, headers });
  }
}

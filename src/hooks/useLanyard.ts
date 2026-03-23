'use client';

import { useSyncExternalStore } from 'react';
import { DISCORD_ID } from '@/lib/constants';
import type { LanyardData, LanyardWebSocketMessage } from '@/lib/types';

interface LanyardStoreState {
  data: LanyardData | null;
  error: Error | null;
  isLoading: boolean;
}

const RECONNECT_DELAY_MS = 3000;

let state: LanyardStoreState = {
  data: null,
  error: null,
  isLoading: true,
};

const listeners = new Set<() => void>();

let ws: WebSocket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let hasReceivedData = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setStoreState(patch: Partial<LanyardStoreState>) {
  state = { ...state, ...patch };
  emit();
}

function clearHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectSocket();
  }, RECONNECT_DELAY_MS);
}

function connectSocket() {
  if (typeof window === 'undefined') return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket('wss://api.lanyard.rest/socket');

    ws.onopen = () => {
      if (process.env.NODE_ENV === 'development') {
        console.info('Lanyard socket connected');
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: LanyardWebSocketMessage = JSON.parse(event.data);

        if (message.op === 1) {
          const helloData = message.d as { heartbeat_interval: number };
          ws?.send(
            JSON.stringify({
              op: 2,
              d: { subscribe_to_id: DISCORD_ID },
            })
          );

          clearHeartbeat();
          heartbeatTimer = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 3 }));
            }
          }, helloData.heartbeat_interval);
          return;
        }

        if (message.op === 0 && (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE')) {
          hasReceivedData = true;
          setStoreState({
            data: message.d as LanyardData,
            error: null,
            isLoading: false,
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Lanyard message parse warning:', err);
        }
      }
    };

    ws.onerror = () => {
      // Browser WebSocket errors are opaque; reconnect via onclose.
      if (!hasReceivedData) {
        setStoreState({
          error: new Error('WebSocket connection error'),
          isLoading: false,
        });
      }
    };

    ws.onclose = () => {
      if (process.env.NODE_ENV === 'development') {
        console.info('Lanyard socket closed');
      }
      clearHeartbeat();
      ws = null;
      scheduleReconnect();
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Lanyard socket creation warning:', err);
    }
    setStoreState({
      error: err instanceof Error ? err : new Error('Failed to connect to Lanyard'),
      isLoading: false,
    });
    scheduleReconnect();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  connectSocket();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useLanyard() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

import { useEffect, useState, useRef, useCallback } from 'react';

export interface MarketTick {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  spread?: number;
  change: number;
  changePct: number;
  volume?: number;
  timestamp: string;
}

export type ConnectionStatus = 'LIVE' | 'CONNECTING' | 'RECONNECTING' | 'CACHED' | 'OFFLINE';

export function useMarketStream(symbols: string[] = ['AAPL', 'MSFT', 'NVDA', 'SPY', 'QQQ']) {
  const [ticks, setTicks] = useState<Record<string, MarketTick>>({});
  const [status, setStatus] = useState<ConnectionStatus>('CONNECTING');
  const [lastUpdate, setLastUpdate] = useState<string>('Just now');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const isSecure = window.location.protocol === 'https:';
      const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
      const wsUrl = `${isSecure ? 'wss:' : 'ws:'}//${wsHost}/ws/market-data`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('LIVE');
        // Subscribe to initial symbols
        ws.send(JSON.stringify({ action: 'subscribe', symbols }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TICK' || msg.symbol) {
            const tick: MarketTick = {
              symbol: msg.symbol,
              price: msg.price,
              bid: msg.bid || msg.price * 0.9998,
              ask: msg.ask || msg.price * 1.0002,
              spread: msg.spread || 0.02,
              change: msg.change || 0.0,
              changePct: msg.changePct || 0.0,
              volume: msg.volume,
              timestamp: msg.timestamp || new Date().toISOString(),
            };
            setTicks((prev) => ({ ...prev, [tick.symbol]: tick }));
            setLastUpdate(new Date().toLocaleTimeString());
          }
        } catch (e) {
          // JSON parse ignore
        }
      };

      ws.onerror = () => {
        setStatus('CACHED');
      };

      ws.onclose = () => {
        setStatus('OFFLINE');
        // Auto-reconnect after 4s
        reconnectTimeoutRef.current = setTimeout(() => {
          setStatus('RECONNECTING');
          connect();
        }, 4000);
      };
    } catch (e) {
      setStatus('CACHED');
    }
  }, [symbols]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return {
    ticks,
    status,
    lastUpdate,
  };
}

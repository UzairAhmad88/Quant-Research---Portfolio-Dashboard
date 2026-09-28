# Real-Time Market Data Architecture

## 1. Overview
The real-time market data subsystem provides sub-second live quote streaming, tick validation, spread calculation, and reactive frontend chart updates without requiring full-dataset polling or page reloads.

```
+-------------------------------------------------------------+
| Real-Time Market Data Stream Architecture                   |
+-------------------------------------------------------------+
               Market Data Source (WebSockets / Polling)
                                  |
                                  v
                    MarketDataStreamManager (Backend)
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
   Symbol Subscription Pool                     Tick Normalizer
            |                                           |
            v                                           v
    Heartbeat & State Cache                      Rule Evaluator (Alerts)
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
                    FastAPI WebSocket Endpoint (/ws/market-data)
                                  |
                                  v
                     useMarketStream Hook (React Client)
                                  |
            +---------------------+---------------------+
            |                     |                     |
            v                     v                     v
     Live Market Grid      Candle Updater        Alert Notification Center
```

## 2. Server-Side WebSocket Engine (`websocket_manager.py`)
- **Connection Management**: Tracks active client connections with automatic disconnection cleanup and error handling.
- **Symbol Subscriptions**: Clients send `{ "action": "subscribe", "symbols": ["AAPL", "MSFT"] }` frames to dynamically listen to specific market feeds.
- **Broadcast Protocol**: JSON frames broadcast normalized ticks containing `symbol`, `price`, `bid`, `ask`, `spread`, `change`, `change_pct`, `volume`, `timestamp`, `status`, and `freshness`.
- **Alert Dispatch**: When market ticks breach active user alert rules (`PRICE_ABOVE`, `PRICE_BELOW`, `VOLATILITY`), an `ALERT_TRIGGERED` payload is instantly pushed over the socket.

## 3. Client-Side Hook (`useMarketStream.ts`)
- **Resilient Connection**: Connects to the local/production WebSocket endpoint (`ws://` or `wss://`), handling browser lifecycle events.
- **Auto-Reconnect**: Exponential backoff reconnection algorithm upon connection drops.
- **State Aggregation**: Maps streaming updates to state stores, triggering micro-animations and instantaneous bid/ask updates.

## 4. Zero Mock Policy
- The streaming engine reflects true market updates or clearly indicates `UNAVAILABLE` / `STANDBY` status.
- No synthetic random walks or fake prices are generated in production environments.

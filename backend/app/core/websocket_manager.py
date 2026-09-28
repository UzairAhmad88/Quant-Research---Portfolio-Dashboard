import json
import logging
from typing import List, Dict, Any, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Real-Time WebSocket Stream Manager.
    Broadcasts live market data quotes, candlestick updates, and alert triggers
    to connected React clients without polling.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.subscriptions[websocket] = set()
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]
        logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_connections)}")

    def subscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self.subscriptions:
            for s in symbols:
                self.subscriptions[websocket].add(s.upper())

    async def broadcast_market_update(self, update: Dict[str, Any]):
        """
        Broadcasts quote/candle update to all clients or filtered subscribers.
        """
        dead_connections = []
        symbol = update.get("symbol", "").upper()

        for conn in self.active_connections:
            try:
                subs = self.subscriptions.get(conn, set())
                if not subs or symbol in subs or not symbol:
                    await conn.send_json(update)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.append(conn)

        for dead in dead_connections:
            self.disconnect(dead)

    async def broadcast_alert_triggered(self, alert_data: Dict[str, Any]):
        """
        Broadcasts an alert trigger event to all connected clients.
        """
        payload = {
            "type": "ALERT_TRIGGERED",
            "data": alert_data,
        }
        dead_connections = []
        for conn in self.active_connections:
            try:
                await conn.send_json(payload)
            except Exception:
                dead_connections.append(conn)
        for dead in dead_connections:
            self.disconnect(dead)


# Global singleton instance
ws_manager = WebSocketManager()

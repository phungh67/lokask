import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketStatus = "disconnected" | "connecting" | "connected" | "error";

export const useWebSocket = (
  url: string | null, 
  onMessageReceived?: (data: any) => void
) => {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  
  const savedCallback = useRef(onMessageReceived);

  useEffect(() => {
    savedCallback.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!url) return;

    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      setStatus("error");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (savedCallback.current) {
          savedCallback.current(data);
        }
      } catch (err) {
        console.error("Failed to parse incoming WebSocket message:", err);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [url]);

  const sendMessage = useCallback((payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket is not connected. Dropping payload:", payload);
    }
  }, []);

  return { status, sendMessage };
};
/* Minimal chat WebSocket client: connect with a bearer token in the query
 * string, auto-reconnect with backoff, heartbeat ping, and a tiny subscriber
 * registry. The backend (FastAPI /api/v1/ws/chat) pushes message / chat_update
 * / chat_new / read / typing / presence frames. */
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const WS_URL = `${API.replace(/^http/, "ws")}/api/v1/ws/chat`;

type Handler = (msg: any) => void;

class ChatSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers = new Set<Handler>();
  private closedByUs = false;
  private retry = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** (Re)connect with the given access token. No-op if already open on it. */
  connect(token: string) {
    if (this.token === token && this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this.token = token;
    this.closedByUs = false;
    this.openSocket();
  }

  private openSocket() {
    if (typeof window === "undefined" || !this.token) return;
    try {
      this.ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(this.token)}`);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => { this.retry = 0; this.startPing(); };
    this.ws.onmessage = (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }
      this.handlers.forEach((h) => { try { h(msg); } catch { /* handler error */ } });
    };
    this.ws.onclose = () => { this.stopPing(); if (!this.closedByUs) this.scheduleReconnect(); };
    this.ws.onerror = () => { try { this.ws?.close(); } catch { /* noop */ } };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.retry += 1;
    const delay = Math.min(1000 * 2 ** this.retry, 15000);
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; this.openSocket(); }, delay);
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => this.send({ type: "ping" }), 25000);
  }
  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  send(obj: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  /** Subscribe to incoming frames; returns an unsubscribe function. */
  on(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  close() {
    this.closedByUs = true;
    this.token = null;
    this.stopPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    try { this.ws?.close(); } catch { /* noop */ }
    this.ws = null;
  }
}

export const chatSocket = new ChatSocket();

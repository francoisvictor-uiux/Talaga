import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { API_URL, getAuthToken } from "./api";

type Listener = (scope: string) => void;

let connection: HubConnection | null = null;
let starting: Promise<HubConnection> | null = null;
const listeners = new Set<Listener>();

function buildConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/dashboard`, {
      accessTokenFactory: () => getAuthToken() ?? "",
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

async function ensureConnection(): Promise<HubConnection> {
  if (connection && connection.state === HubConnectionState.Connected) return connection;
  if (starting) return starting;

  const c = buildConnection();
  c.on("dataChanged", (scope: string) => {
    for (const cb of listeners) {
      try { cb(scope); } catch { /* swallow listener errors */ }
    }
  });
  c.onreconnected(() => {
    for (const cb of listeners) {
      try { cb("reconnected"); } catch { /* */ }
    }
  });

  starting = c.start().then(() => { connection = c; return c; });
  try {
    return await starting;
  } finally {
    starting = null;
  }
}

export function onDataChanged(cb: Listener): () => void {
  listeners.add(cb);
  ensureConnection().catch((err) => {
    console.warn("[realtime] connection failed:", err);
  });
  return () => {
    listeners.delete(cb);
  };
}

export async function disconnectRealtime(): Promise<void> {
  if (connection) {
    try { await connection.stop(); } catch { /* */ }
    connection = null;
  }
  listeners.clear();
}

// In-memory state for the keepalive worker.
// Resets on each deploy, which is acceptable for v1.

let lastKeepalivePing: string | null = null;

export function getLastKeepalivePing(): string | null {
  return lastKeepalivePing;
}

export function setLastKeepalivePing(timestamp: string): void {
  lastKeepalivePing = timestamp;
}

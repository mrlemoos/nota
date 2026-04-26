import { contextBridge, ipcRenderer } from 'electron';

const NOTA_MENUBAR_ACTION_CHANNEL = 'nota-menubar-action';

const pending: unknown[] = [];
const listeners = new Set<(payload: unknown) => void>();

function dispatch(payload: unknown): void {
  if (listeners.size > 0) {
    for (const fn of listeners) {
      fn(payload);
    }
  } else {
    pending.push(payload);
  }
}

ipcRenderer.on(NOTA_MENUBAR_ACTION_CHANNEL, (_event, payload: unknown) => {
  dispatch(payload);
});

contextBridge.exposeInMainWorld('nota', {
  subscribeMenubarActions(cb: (payload: unknown) => void): () => void {
    listeners.add(cb);
    while (pending.length > 0) {
      const next = pending.shift();
      if (next !== undefined) {
        cb(next);
      }
    }
    return () => {
      listeners.delete(cb);
    };
  },
});

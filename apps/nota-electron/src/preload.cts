import { contextBridge, ipcRenderer } from 'electron';
import {
  NOTA_UPDATES_CHECK_CHANNEL,
  NOTA_UPDATES_QUIT_INSTALL_CHANNEL,
  NOTA_UPDATES_STATUS_CHANNEL,
} from './nota-updater-channels.js';

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

const updatePending: unknown[] = [];
const updateListeners = new Set<(payload: unknown) => void>();

function dispatchUpdateStatus(payload: unknown): void {
  if (updateListeners.size > 0) {
    for (const fn of updateListeners) {
      fn(payload);
    }
  } else {
    updatePending.push(payload);
  }
}

ipcRenderer.on(NOTA_UPDATES_STATUS_CHANNEL, (_event, payload: unknown) => {
  dispatchUpdateStatus(payload);
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

  subscribeUpdateStatus(cb: (payload: unknown) => void): () => void {
    updateListeners.add(cb);
    while (updatePending.length > 0) {
      const next = updatePending.shift();
      if (next !== undefined) {
        cb(next);
      }
    }
    return () => {
      updateListeners.delete(cb);
    };
  },

  checkForUpdates(): Promise<{
    ok: boolean;
    reason?: 'development' | 'not-initialised' | 'check-failed';
  }> {
    return ipcRenderer.invoke(NOTA_UPDATES_CHECK_CHANNEL);
  },

  quitAndInstall(): Promise<boolean> {
    return ipcRenderer.invoke(NOTA_UPDATES_QUIT_INSTALL_CHANNEL);
  },
});

import { BrowserWindow, app, ipcMain } from 'electron';
import {
  NOTA_UPDATES_CHECK_CHANNEL,
  NOTA_UPDATES_QUIT_INSTALL_CHANNEL,
  NOTA_UPDATES_STATUS_CHANNEL,
} from './nota-updater-channels.js';

function formatUpdaterError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

type BroadcastPayload =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string }
  | { phase: 'not-available' }
  | { phase: 'downloading'; percent: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'error'; message: string }
  | { phase: 'unavailable'; reason: 'development' };

function broadcastNotaUpdateStatus(payload: BroadcastPayload): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(NOTA_UPDATES_STATUS_CHANNEL, payload);
    }
  }
}

let autoUpdaterInstance: import('electron-updater').AppUpdater | null = null;
let listenersAttached = false;

function attachAutoUpdaterListeners(
  autoUpdater: import('electron-updater').AppUpdater,
): void {
  if (listenersAttached) {
    return;
  }
  listenersAttached = true;

  autoUpdater.on('checking-for-update', () => {
    broadcastNotaUpdateStatus({ phase: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    broadcastNotaUpdateStatus({
      phase: 'available',
      version: info.version,
    });
  });

  autoUpdater.on('update-not-available', () => {
    broadcastNotaUpdateStatus({ phase: 'not-available' });
  });

  autoUpdater.on('error', (error) => {
    console.error('[nota-electron] auto-updater error', error);
    broadcastNotaUpdateStatus({
      phase: 'error',
      message: formatUpdaterError(error),
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    broadcastNotaUpdateStatus({
      phase: 'downloading',
      percent: Math.round(progress.percent),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[nota-electron] update downloaded; restart to apply');
    broadcastNotaUpdateStatus({
      phase: 'downloaded',
      version: info.version,
    });
  });
}

export function registerNotaUpdaterIpc(): void {
  ipcMain.handle(NOTA_UPDATES_CHECK_CHANNEL, async () => {
    if (!app.isPackaged) {
      broadcastNotaUpdateStatus({
        phase: 'unavailable',
        reason: 'development',
      });
      return { ok: false as const, reason: 'development' as const };
    }
    const updater = autoUpdaterInstance;
    if (!updater) {
      broadcastNotaUpdateStatus({
        phase: 'error',
        message: 'Updater not initialised',
      });
      return { ok: false as const, reason: 'not-initialised' as const };
    }
    try {
      await updater.checkForUpdates();
      return { ok: true as const };
    } catch (error) {
      broadcastNotaUpdateStatus({
        phase: 'error',
        message: formatUpdaterError(error),
      });
      return { ok: false as const, reason: 'check-failed' as const };
    }
  });

  ipcMain.handle(NOTA_UPDATES_QUIT_INSTALL_CHANNEL, () => {
    if (!app.isPackaged || !autoUpdaterInstance) {
      return false;
    }
    autoUpdaterInstance.quitAndInstall(false, true);
    return true;
  });
}

export async function startPackagedNotaUpdater(): Promise<void> {
  if (!app.isPackaged) {
    return;
  }
  const electronUpdater = (await import('electron-updater')).default;
  const { autoUpdater } = electronUpdater;
  autoUpdater.autoDownload = true;
  autoUpdaterInstance = autoUpdater;
  attachAutoUpdaterListeners(autoUpdater);
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('[nota-electron] initial update check failed', error);
    broadcastNotaUpdateStatus({
      phase: 'error',
      message: formatUpdaterError(error),
    });
  }
}

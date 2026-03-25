import { contextBridge } from 'electron';

/** Empty bridge so the renderer can detect the Nota shell when the UA omits "Electron". */
contextBridge.exposeInMainWorld('nota', {});

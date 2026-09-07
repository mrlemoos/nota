/** Global CSS class names :  keep in sync with `styles.css` */
export const ELECTRON_WINDOW_DRAG_CLASS = 'electron-window-drag';
export const ELECTRON_WINDOW_NO_DRAG_CLASS = 'electron-window-no-drag';

export function electronWindowDragClasses(): {
  drag: typeof ELECTRON_WINDOW_DRAG_CLASS;
  noDrag: typeof ELECTRON_WINDOW_NO_DRAG_CLASS;
} {
  return {
    drag: ELECTRON_WINDOW_DRAG_CLASS,
    noDrag: ELECTRON_WINDOW_NO_DRAG_CLASS,
  };
}

/**
 * Marks `<html>` while running inside the Electron shell, which is what the
 * vibrancy rules in `styles.css` and `theme-color.ts` key off.
 */
export const NOTA_ELECTRON_HTML_CLASS = 'nota-electron';

/**
 * Body of a blocking inline script for the document head.
 *
 * @remarks
 * The class has to land before the first paint: the packaged app loads the
 * hosted origin, so adding it from an effect would paint one opaque frame over
 * the native vibrancy. Detection mirrors `isElectronShellSync` — the preload
 * bridge if it is already there, otherwise the user agent.
 */
export const NOTA_ELECTRON_HTML_CLASS_SCRIPT = `(function(){try{if(typeof window.nota!=='undefined'||navigator.userAgent.toLowerCase().indexOf('electron')>-1){document.documentElement.classList.add('${NOTA_ELECTRON_HTML_CLASS}')}}catch(e){}})()`;

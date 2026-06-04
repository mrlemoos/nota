/** TenTap WebView CSS so note body typography matches the web editor surface. */
export function buildNoteEditorBodyCss(bodyFontFamily: string): string {
  const family = JSON.stringify(bodyFontFamily);
  return `
    .ProseMirror {
      font-family: ${family}, ui-sans-serif, system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.625;
      color: #111111;
    }
    .ProseMirror p {
      margin: 0.35em 0;
    }
    .ProseMirror h1,
    .ProseMirror h2,
    .ProseMirror h3 {
      font-family: ${family}, ui-sans-serif, system-ui, sans-serif;
      font-weight: 600;
      line-height: 1.25;
      margin: 0.75em 0 0.35em;
    }
  `;
}

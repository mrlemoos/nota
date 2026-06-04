/**
 * @nota/mobile-editor - Hybrid Island Architecture (Skeleton)
 *
 * Per the locked hybrid model:
 * - Simple nodes (see node-contract.ts NOTA_SIMPLE_NODES): implemented with native
 *   RN components / gestures / TextInput composition for calm, low-latency editing.
 * - Complex nodes (NOTA_COMPLEX_NODES): rendered as isolated WebView "islands"
 *   that live inside the document flow (or a virtualized list).
 *
 * This file defines the registration + config contract ONLY.
 * Actual mounting, virtualization (FlashList etc), and WebView<->bridge coordination
 * for islands will be implemented in later phases on top of (or replacing) the
 * initial TenTap full-WebView surface.
 *
 * Why islands?
 * - Tables, mermaid, PDF viewers, heavy custom code blocks, NotePdf/NoteImage interactive
 *   previews, etc. are extremely expensive or impossible to replicate 1:1 in pure native RN.
 * - A small WebView per complex node keeps fidelity (uses same web rendering code as desktop
 *   where possible) while the main text flow stays fast/native.
 * - Strong virtualization ensures only visible islands are mounted.
 *
 * Integration path (future):
 * 1. Advanced TenTap setup with customSource (our own bundled web editor HTML that
 *    registers ALL the same custom extensions as @nota/editor for 100% JSON fidelity).
 * 2. On native side: instead of (or layered over) <RichText>, walk the JSON doc and
 *    render a virtualized list of rows.
 * 3. For each row/node: if simple -> <NativeParagraph | NativeHeading | ... />
 *                    if complex -> <HybridIslandWebView config={get...} nodeJSON={...} />
 * 4. Edits to simple nodes go through native state machine + sync back to a hidden
 *    TenTap "authority" webview (or eventually pure native PM port) to keep JSON canonical.
 * 5. Islands handle their own internal editing (e.g. table cell edits) and emit
 *    JSON patches upward.
 *
 * Restrained haptics: only very light on important structural changes.
 */

import type { ComponentType } from 'react';
import type { PMJSONNode } from './content-utils';
import type { MobileNodeContract } from './node-contract';
import { isComplexNotaNode } from './node-contract';

export interface HybridIslandConfig {
  /** Matches the node name from contract / PM JSON (e.g. 'notePdf', 'table') */
  nodeName: string;

  /**
   * Optional: a fully native fallback renderer (used when webview island disabled
   * or for simpler complex nodes in future).
   */
  NativeFallback?: ComponentType<{
    node: PMJSONNode;
    noteId: string;
    userId: string;
    // ... attachment context etc.
  }>;

  /**
   * WebView island configuration.
   * In real impl the island will receive a tiny self-contained HTML/JS bundle
   * (or injected script) that knows how to render + edit just this node type
   * using the same TipTap node definition as web.
   */
  webView?: {
    /** Inline HTML for the island (preferred for offline + no network fetch) */
    html?: string;
    /** Or a bundled asset / uri */
    sourceUri?: string;
    /** Injected JS that sets up the mini-editor for this node only */
    injectedJavaScript?: string;
    /** Height behavior: fixed, auto (from content), or dynamic via postMessage */
    heightMode?: 'fixed' | 'auto' | 'dynamic';
    fixedHeight?: number;
  };

  /**
   * Called when the island wants to mutate the parent doc JSON (e.g. table structure change).
   * The parent editor applies a transform and re-renders.
   */
  onNodeUpdate?: (
    nodeName: string,
    newAttrs: Record<string, unknown>,
    newContent?: PMJSONNode[],
  ) => void;

  /**
   * Metadata for virtualization decisions and calm UX.
   */
  meta?: {
    isHeavy?: boolean; // true for PDF, mermaid render, large tables → prioritize lazy mount
    prefersFullWidth?: boolean;
    estimatedHeight?: number;
  };
}

const islandRegistry = new Map<string, HybridIslandConfig>();

/**
 * Register a hybrid island handler for a complex node.
 * Called at startup / plugin registration time.
 */
export function registerHybridIsland(config: HybridIslandConfig): void {
  if (!isComplexNotaNode(config.nodeName)) {
    // Still allow registration for forward-compat, but warn in dev
    if (__DEV__) {
      console.warn(
        `[mobile-editor] registerHybridIsland: "${config.nodeName}" is not listed in NOTA_COMPLEX_NODES. ` +
          'Add it to the contract if it is a permanent Nota node.',
      );
    }
  }
  islandRegistry.set(config.nodeName, config);
}

/** Retrieve config for a node (used by future hybrid renderer) */
export function getHybridIsland(
  nodeName: string,
): HybridIslandConfig | undefined {
  return islandRegistry.get(nodeName);
}

/** List all currently registered islands (for debug / testing) */
export function getAllRegisteredIslands(): HybridIslandConfig[] {
  return Array.from(islandRegistry.values());
}

/**
 * Default / placeholder configs for the core complex nodes.
 * These are registered automatically on import for skeleton completeness.
 * Real implementations will replace the placeholders with actual WebView bundles
 * (e.g. a minimal mermaid renderer, pdf.js in a tiny webview, table editor component, etc.).
 */
function registerDefaultPlaceholders() {
  const defaults: HybridIslandConfig[] = [
    {
      nodeName: 'notePdf',
      meta: { isHeavy: true, prefersFullWidth: true, estimatedHeight: 240 },
      // Placeholder: real version will inject a tiny pdf viewer webview + thumbnail bridge
    },
    {
      nodeName: 'noteImage',
      meta: { prefersFullWidth: false, estimatedHeight: 200 },
    },
    {
      nodeName: 'noteAudio',
      meta: { estimatedHeight: 80 },
    },
    {
      nodeName: 'linkPreview',
      meta: { estimatedHeight: 120 },
    },
    {
      nodeName: 'table',
      meta: { isHeavy: true, prefersFullWidth: true, estimatedHeight: 160 },
    },
    {
      nodeName: 'codeBlock',
      // Advanced code blocks (with lowlight, copy, mermaid detection) become islands
      // while a super-minimal code span might stay native in future.
      meta: { estimatedHeight: 140 },
    },
  ];

  for (const cfg of defaults) {
    if (!islandRegistry.has(cfg.nodeName)) {
      islandRegistry.set(cfg.nodeName, cfg);
    }
  }
}

// Auto-register placeholders when this module is first imported.
// This gives an immediately queryable skeleton without side effects elsewhere.
registerDefaultPlaceholders();

/**
 * Future helper (stub): given a full doc JSON, returns a list of "render items"
 * distinguishing simple vs island nodes. The hybrid renderer will consume this.
 */
export interface DocRenderItem {
  id: string; // stable key, e.g. pos or uuid if we add them
  type: 'simple' | 'island';
  node: PMJSONNode;
  contract?: MobileNodeContract;
  islandConfig?: HybridIslandConfig;
}

export function buildDocRenderItems(): DocRenderItem[] {
  // Placeholder implementation — real version walks the content array recursively
  // (handling lists, tables, etc.) and produces flat virtualizable items.
  // Strong virtualization (react-native-reanimated + FlashList or custom) is required
  // for long documents per the calm experience goals.
  return [];
}

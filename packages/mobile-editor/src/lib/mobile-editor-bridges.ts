/**
 * @nota/mobile-editor - Extension / Bridge registration system
 *
 * This is the single source of truth (inside the mobile package) for which
 * TipTap/ProseMirror nodes, marks, and extensions are active.
 *
 * Goal: identical JSON output to web @nota/editor.
 *
 * Current phase (foundations):
 * - Uses TenTap BridgeExtensions (the "simple usage" path).
 * - Registers only the bridges needed for basic paragraph + heading POC
 *   (plus a few other simple nodes we will expand rapidly).
 *
 * Future phases:
 * - Move to TenTap "advanced usage" with a custom bundled web editor source
 *   (customSource) that imports the *exact* same custom Node.create definitions
 *   as packages/editor/src/components/tiptap/* (NotaLink, NotePdf, NoteImage,
 *   NotaSmilieReplacer, LinkPreview, custom code blocks, etc.).
 * - That guarantees 100% schema + JSON fidelity even for complex nodes.
 * - Simple nodes will gradually be "ejected" to a pure-native implementation
 *   (see hybrid-islands.ts and ARCHITECTURE.md) while the authority webview
 *   (or future native PM) keeps the canonical document JSON.
 *
 * The bridges list here is deliberately small and explicit so we can reason
 * about parity one node at a time.
 */

import type { BridgeExtension } from '@10play/tentap-editor';
// NOTE: We import specific bridges rather than a giant starter kit so we have
// precise control and can later drop/replace bridges as we build native paths.

import {
  CoreBridge,
  HeadingBridge,
  BoldBridge,
  ItalicBridge,
  StrikeBridge,
  BulletListBridge,
  OrderedListBridge,
  ListItemBridge,
  TaskListBridge,
  HistoryBridge,
  PlaceholderBridge,
  // LinkBridge will be added when we wire NotaLink-equivalent (custom attrs)
  // HighlightBridge, etc. come later with marks parity.
} from '@10play/tentap-editor';

// Re-export for consumers and tests
export type { BridgeExtension };

/**
 * The authoritative list of TenTap bridges used by NotaMobileEditor.
 *
 * This list is the "registration system". Adding a bridge here makes the
 * corresponding node/mark available to the editor surface and to getJSON().
 *
 * To keep JSON identical to web:
 * - Simple nodes (paragraph, heading, lists, tasks, basic marks) are covered here.
 * - Complex nodes (tables, notePdf etc.) are intentionally omitted from the
 *   simple bridge list for now; they will arrive via the custom web bundle in
 *   the advanced phase (or via hybrid islands that bypass the main surface).
 */
export const notaMobileBridges: BridgeExtension[] = [
  CoreBridge, // doc, paragraph, text, basic history/selection
  HeadingBridge.configureExtension({
    // Web supports levels 1-6 via StarterKit. Match the common ones.
    levels: [1, 2, 3, 4, 5, 6],
  }),
  BoldBridge,
  ItalicBridge,
  StrikeBridge,
  BulletListBridge,
  OrderedListBridge,
  ListItemBridge,
  TaskListBridge,
  HistoryBridge,
  // Placeholder is configured at runtime via editor.setPlaceholder in component
  PlaceholderBridge,
];

/**
 * Factory that returns a fresh copy of the base Nota bridge list.
 * Useful if consumers want to .concat() additional bridges.
 */
export function createNotaMobileBridges(): BridgeExtension[] {
  return [...notaMobileBridges];
}

/**
 * Placeholder for the future advanced/custom web bundle registration point.
 * When we switch to advanced usage we will export something like:
 *
 *   export async function createNotaAdvancedWebEditorSource(): Promise<string> { ... }
 *
 * that bundles the real @tiptap extensions from a controlled web build
 * (or copied source) so that the JSON shape for *every* node (including
 * notePdf, linkPreview, custom codeBlock with lowlight, etc.) is byte-identical.
 */
export const ADVANCED_CUSTOM_BUNDLE_NOT_YET_IMPLEMENTED = true;

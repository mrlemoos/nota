/**
 * @nota/mobile-editor - Node contract
 *
 * A platform-agnostic, minimal contract describing Nota document nodes and marks.
 * Used to:
 * - Guide native/bridge implementations for simple nodes (paragraph, headings, lists, tasks, basic marks)
 * - Document hybrid islands for complex nodes (notePdf, noteImage, tables, mermaid, custom code, etc.)
 * - Drive future fidelity tests that assert identical ProseMirror JSON output
 *   vs. the web @nota/editor (without depending on web-only @tiptap packages here).
 *
 * All implementations (TenTap bridges today, future native simple-node renderer + WebView islands)
 * MUST produce JSON that structurally matches the contracts below + web schema.
 */

export interface NodeAttributeSpec {
  /** Default value used when attr is absent */
  default?: unknown;
  /** Optional: for validation / future native parsing */
  isRequired?: boolean;
}

export interface MobileNodeContract {
  /** ProseMirror / TipTap node name (e.g. 'paragraph', 'heading', 'notePdf') */
  name: string;
  /** block | inline | etc. Matches PM group */
  group?: string;
  /** PM content expression (e.g. 'inline*', 'block+', 'text*') */
  content?: string;
  /** Marks allowed on this node */
  marks?: string;
  /** True for atom nodes (e.g. notePdf, linkPreview) */
  atom?: boolean;
  /** Selectable in editor */
  selectable?: boolean;
  /** Draggable */
  draggable?: boolean;
  /** Attribute specs (must match web extension addAttributes) */
  attrs?: Record<string, NodeAttributeSpec>;
}

export interface MobileMarkContract {
  /** Mark name (e.g. 'bold', 'link', 'highlight') */
  name: string;
  attrs?: Record<string, NodeAttributeSpec>;
}

/**
 * Core simple nodes that MUST be implemented natively (or via bridge) for performance + calm typing.
 * These produce the everyday writing experience.
 */
export const NOTA_SIMPLE_NODES: readonly MobileNodeContract[] = [
  {
    name: 'doc',
    content: 'block+',
  },
  {
    name: 'paragraph',
    group: 'block',
    content: 'inline*',
  },
  {
    name: 'heading',
    group: 'block',
    content: 'inline*',
    attrs: {
      level: { default: 1 },
    },
  },
  {
    name: 'bulletList',
    group: 'block',
    content: 'listItem+',
  },
  {
    name: 'orderedList',
    group: 'block',
    content: 'listItem+',
  },
  {
    name: 'listItem',
    content: 'paragraph block*',
  },
  {
    name: 'taskList',
    group: 'block',
    content: 'taskItem+',
  },
  {
    name: 'taskItem',
    content: 'paragraph block*',
    attrs: {
      checked: { default: false },
    },
  },
  // text is implicit inline
] as const;

/**
 * Complex / heavy nodes that use WebView "islands" in the hybrid model.
 * These are never fully reimplemented natively.
 */
export const NOTA_COMPLEX_NODES: readonly MobileNodeContract[] = [
  {
    name: 'notePdf',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    attrs: {
      attachmentId: {},
      filename: { default: '' },
    },
  },
  {
    name: 'noteImage',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    attrs: {
      attachmentId: {},
      filename: { default: '' },
    },
  },
  {
    name: 'noteAudio',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    attrs: {
      attachmentId: {},
      filename: { default: '' },
    },
  },
  {
    name: 'linkPreview',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,
    attrs: {
      href: {},
      title: { default: null },
      description: { default: null },
      image: { default: null },
    },
  },
  {
    name: 'codeBlock',
    group: 'block',
    content: 'text*',
    attrs: {
      language: { default: null },
    },
  },
  {
    name: 'table',
    group: 'block',
    content: 'tableRow+',
  },
  {
    name: 'tableRow',
    content: '(tableCell | tableHeader)+',
  },
  {
    name: 'tableHeader',
    content: 'block+',
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    },
  },
  {
    name: 'tableCell',
    content: 'block+',
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    },
  },
  // Future: mermaid diagrams, advanced embeds, etc. will be added here as complex islands
] as const;

/**
 * Marks (formatting) supported on inline content.
 */
export const NOTA_MARKS: readonly MobileMarkContract[] = [
  { name: 'bold' },
  { name: 'italic' },
  { name: 'strike' },
  { name: 'code' },
  {
    name: 'link',
    attrs: {
      href: {},
      target: { default: '_blank' },
      rel: { default: 'noopener noreferrer nofollow' },
      // Nota-specific extension attr (see web NotaLink)
      skipLinkPreview: { default: false },
    },
  },
  {
    name: 'highlight',
    attrs: {
      color: { default: null },
    },
  },
] as const;

/**
 * All known Nota nodes (simple + complex) for registration/validation helpers.
 */
export const ALL_NOTA_NODES: readonly MobileNodeContract[] = [
  ...NOTA_SIMPLE_NODES,
  ...NOTA_COMPLEX_NODES,
] as const;

/** Helper to look up a node contract by name (for future fidelity + hybrid dispatch) */
export function getNotaNodeContract(
  name: string,
): MobileNodeContract | undefined {
  return ALL_NOTA_NODES.find((n) => n.name === name);
}

/** Helper to check if a node should be handled natively (simple path) vs island (complex) */
export function isSimpleNotaNode(name: string): boolean {
  return NOTA_SIMPLE_NODES.some((n) => n.name === name);
}

export function isComplexNotaNode(name: string): boolean {
  return NOTA_COMPLEX_NODES.some((n) => n.name === name);
}

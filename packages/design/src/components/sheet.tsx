/**
 * Sheet primitives built on Base UI Drawer (shadcn `sheet` shape).
 *
 * @remarks
 * Import from the package subpath only:
 * `import { Sheet, SheetContent, … } from '@getmadrid/design/sheet'`.
 *
 * Unlike {@link ./dialog.tsx | Dialog}, a sheet is edge-anchored and
 * swipe-dismissable: Base UI's Drawer tracks the pointer/touch drag, exposes it
 * as `--drawer-swipe-movement-{x,y}` / `--drawer-swipe-progress`, and scales the
 * release transition with `--drawer-swipe-strength`. The transform itself lives
 * in `.nota-sheet-popup` / `.nota-sheet-backdrop`
 * ({@link ../theme-chrome.css | theme-chrome.css}) because Base UI writes an
 * inline `transform` while dragging, which a Tailwind `translate` utility would
 * compose with instead of override.
 *
 * `side` sits on the root (it selects the swipe direction) rather than on
 * {@link SheetContent}; the content reads it back from context.
 *
 * @packageDocumentation
 */

import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';

import { Button } from './button.js';
import { cn } from '../lib/utils.js';

/** Edge the sheet is anchored to (and swiped towards to dismiss). */
export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const SWIPE_DIRECTION_BY_SIDE = {
  top: 'up',
  right: 'right',
  bottom: 'down',
  left: 'left',
} as const;

const SheetSideContext = createContext<SheetSide>('right');

export type SheetRootProps = ComponentProps<typeof DrawerPrimitive.Root>;
export type SheetTriggerProps = ComponentProps<typeof DrawerPrimitive.Trigger>;
export type SheetPortalProps = ComponentProps<typeof DrawerPrimitive.Portal>;
export type SheetCloseProps = ComponentProps<typeof DrawerPrimitive.Close>;
export type SheetOverlayProps = ComponentProps<typeof DrawerPrimitive.Backdrop>;
export type SheetPopupProps = ComponentProps<typeof DrawerPrimitive.Popup>;
export type SheetBodyProps = ComponentProps<typeof DrawerPrimitive.Content>;
export type SheetTitleProps = ComponentProps<typeof DrawerPrimitive.Title>;
export type SheetDescriptionProps = ComponentProps<
  typeof DrawerPrimitive.Description
>;

export type SheetProps = Omit<SheetRootProps, 'swipeDirection'> & {
  /** Edge to anchor to. @defaultValue 'right' */
  side?: SheetSide;
};

const VIEWPORT_ALIGN_BY_SIDE: Record<SheetSide, string> = {
  top: 'items-start justify-center',
  right: 'items-stretch justify-end',
  bottom: 'items-end justify-center',
  left: 'items-stretch justify-start',
};

const POPUP_EDGE_BY_SIDE: Record<SheetSide, string> = {
  top: 'w-full max-h-[85dvh] rounded-b-2xl border-b',
  right: 'h-full w-[min(28rem,92vw)] rounded-l-2xl border-l',
  bottom: 'w-full max-h-[85dvh] rounded-t-2xl border-t',
  left: 'h-full w-[min(28rem,92vw)] rounded-r-2xl border-r',
};

/** Grab affordance, parked on the edge the drag starts from. */
const HANDLE_BY_SIDE: Record<SheetSide, string> = {
  top: 'bottom-2 left-1/2 h-1 w-10 -translate-x-1/2',
  right: 'left-2 top-1/2 h-10 w-1 -translate-y-1/2',
  bottom: 'top-2 left-1/2 h-1 w-10 -translate-x-1/2',
  left: 'right-2 top-1/2 h-10 w-1 -translate-y-1/2',
};

const DEFAULT_OVERLAY_CLASS = cn(
  'nota-sheet-backdrop fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]',
);

const DEFAULT_POPUP_CLASS = cn(
  'nota-sheet-popup relative isolate z-50 flex flex-col overflow-hidden',
  'border-border/60 bg-background/95 text-foreground shadow-2xl outline-none backdrop-blur-2xl',
);

/**
 * Sheet root. Owns open state, the swipe direction, and the `side` context.
 *
 * @see {@link https://base-ui.com/react/components/drawer | Base UI Drawer}
 */
export function Sheet({ side = 'right', ...props }: SheetProps) {
  return (
    <SheetSideContext.Provider value={side}>
      <DrawerPrimitive.Root
        swipeDirection={SWIPE_DIRECTION_BY_SIDE[side]}
        {...props}
      />
    </SheetSideContext.Provider>
  );
}

/** Button that opens the sheet. */
export const SheetTrigger = DrawerPrimitive.Trigger;

/** Portal for overlay + popup. */
export const SheetPortal = DrawerPrimitive.Portal;

/** Closes the sheet when activated. */
export const SheetClose = DrawerPrimitive.Close;

/**
 * Dimmed backdrop. Fades out in step with the swipe via `--drawer-swipe-progress`.
 */
export function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(DEFAULT_OVERLAY_CLASS, className)}
      {...props}
    />
  );
}

export type SheetContentProps = SheetPopupProps & {
  /** Ghost icon close control in the top-right. @defaultValue true */
  showCloseButton?: boolean;
  /**
   * Grab handle on the swipe edge.
   *
   * @remarks
   * Off by default: on a desktop-sized sheet the knob reads as a resize grip,
   * which a sheet is not. Swipe-to-dismiss works with or without it. Turn it on
   * for touch-first bottom sheets where the handle is the idiom.
   *
   * @defaultValue false
   */
  showHandle?: boolean;
  /** Extra classes for the backdrop. */
  overlayClassName?: string;
};

/**
 * Portaled overlay + viewport + popup. Pass `className` to override the size.
 *
 * @remarks
 * The popup must stay inside `Drawer.Viewport` — the viewport carries the
 * pointer/touch handlers and the scroll-vs-swipe arbitration.
 */
export function SheetContent({
  className,
  children,
  showCloseButton = true,
  showHandle = false,
  overlayClassName,
  ...props
}: SheetContentProps) {
  const side = useContext(SheetSideContext);

  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <DrawerPrimitive.Viewport
        data-slot="sheet-viewport"
        className={cn('fixed inset-0 z-50 flex', VIEWPORT_ALIGN_BY_SIDE[side])}
      >
        <DrawerPrimitive.Popup
          data-slot="sheet-content"
          className={cn(
            DEFAULT_POPUP_CLASS,
            POPUP_EDGE_BY_SIDE[side],
            className,
          )}
          {...props}
        >
          {showHandle ? (
            <span
              aria-hidden
              data-slot="sheet-handle"
              className={cn(
                'absolute z-10 rounded-full bg-foreground/20',
                HANDLE_BY_SIDE[side],
              )}
            />
          ) : null}
          {children}
          {showCloseButton ? (
            <DrawerPrimitive.Close
              data-slot="sheet-close"
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3"
                  aria-label="Close"
                />
              }
            >
              <CloseGlyph />
            </DrawerPrimitive.Close>
          ) : null}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </SheetPortal>
  );
}

/**
 * Scrollable body. Renders Base UI's `Drawer.Content`, which is how the
 * viewport tells "the user is scrolling this" from "the user is swiping the
 * sheet away".
 */
export function SheetBody({ className, ...props }: SheetBodyProps) {
  return (
    <DrawerPrimitive.Content
      data-slot="sheet-body"
      className={cn(
        'min-h-0 flex-1 overflow-auto overscroll-contain',
        className,
      )}
      {...props}
    />
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        'flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3',
        className,
      )}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <DrawerPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        'min-w-0 truncate text-sm font-medium text-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: SheetDescriptionProps) {
  return (
    <DrawerPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-xs/relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * Label parked over the top-left of a full-bleed sheet.
 *
 * @remarks
 * `absolute`, not `fixed`: the popup carries a `transform`, which already makes
 * it the containing block for fixed descendants, and the popup itself does not
 * scroll. Same result, no surprise if the transform ever goes away.
 */
export function SheetFloatingTitle({ className, ...props }: SheetTitleProps) {
  return (
    <DrawerPrimitive.Title
      data-slot="sheet-floating-title"
      className={cn(
        'nota-sheet-floating-title pointer-events-none absolute top-3 left-4 z-20 max-w-[60%] truncate',
        'rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-md',
        className,
      )}
      {...props}
    />
  );
}

/** Control cluster parked over the top-right of a full-bleed sheet. */
export function SheetFloatingActions({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-floating-actions"
      className={cn(
        'nota-sheet-floating-actions absolute top-3 right-4 z-20 flex items-center gap-1',
        'rounded-full bg-background/80 p-0.5 shadow-sm backdrop-blur-md',
        className,
      )}
      {...props}
    />
  );
}

function CloseGlyph(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

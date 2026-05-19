/**
 * Hover card primitives built on Base UI Popover.
 *
 * @remarks
 * Import from the package subpath only:
 * `import { NotaHoverCard, NotaHoverCardTrigger, … } from '@nota/web-design/hover-card'`.
 * The trigger enables hover opening by default; popup is a styled Nota surface.
 *
 * @packageDocumentation
 */

import type { ComponentProps } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

import { cn } from '../lib/utils.js';

export type NotaHoverCardProps = ComponentProps<typeof BasePopover.Root>;
export type NotaHoverCardTriggerProps = ComponentProps<
  typeof BasePopover.Trigger
>;
export type NotaHoverCardPortalProps = ComponentProps<
  typeof BasePopover.Portal
>;
export type NotaHoverCardPositionerProps = ComponentProps<
  typeof BasePopover.Positioner
>;
export type NotaHoverCardPopupProps = ComponentProps<typeof BasePopover.Popup>;

const DEFAULT_HOVER_CARD_POPUP_CLASS = cn(
  'z-50 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg',
  'origin-[var(--transform-origin)] outline-none transition-[transform,scale,opacity]',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
);

export const NotaHoverCard = BasePopover.Root;
export const NotaHoverCardPortal = BasePopover.Portal;
export const NotaHoverCardPositioner = BasePopover.Positioner;

export function NotaHoverCardTrigger({
  delay = 250,
  closeDelay = 120,
  openOnHover = true,
  ...props
}: NotaHoverCardTriggerProps) {
  return (
    <BasePopover.Trigger
      delay={delay}
      closeDelay={closeDelay}
      openOnHover={openOnHover}
      {...props}
    />
  );
}

export function NotaHoverCardPopup({
  className,
  initialFocus = false,
  finalFocus = false,
  ...props
}: NotaHoverCardPopupProps) {
  return (
    <BasePopover.Popup
      initialFocus={initialFocus}
      finalFocus={finalFocus}
      className={cn(DEFAULT_HOVER_CARD_POPUP_CLASS, className)}
      {...props}
    />
  );
}

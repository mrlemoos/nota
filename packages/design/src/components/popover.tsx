/**
 * Popover primitives built on Base UI Popover (click-triggered).
 *
 * @remarks
 * Import from the package subpath only:
 * `import { Popover, PopoverContent, … } from '@getmadrid/design/popover'`.
 * {@link PopoverContent} portals the positioner + popup with Madrid surface
 * styles and {@link NOTA_POPUP_MOTION_CLASS}: scale from the trigger
 * (`--transform-origin`) on open, a shorter fade on close — the macOS
 * `NSPopover` feel. For hover-opened cards use `@getmadrid/design/hover-card`.
 *
 * @packageDocumentation
 */

import type { ComponentProps } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

import { NOTA_POPUP_MOTION_CLASS } from '../lib/nota-popup-motion.js';
import { cn } from '../lib/utils.js';

export type PopoverProps = ComponentProps<typeof BasePopover.Root>;
export type PopoverTriggerProps = ComponentProps<typeof BasePopover.Trigger>;
export type PopoverPortalProps = ComponentProps<typeof BasePopover.Portal>;
export type PopoverPositionerProps = ComponentProps<
  typeof BasePopover.Positioner
>;
export type PopoverPopupProps = ComponentProps<typeof BasePopover.Popup>;
export type PopoverTitleProps = ComponentProps<typeof BasePopover.Title>;
export type PopoverDescriptionProps = ComponentProps<
  typeof BasePopover.Description
>;

const DEFAULT_POPUP_CLASS = cn(
  'z-50 rounded-xl border border-border/60 bg-popover p-3 text-popover-foreground shadow-lg outline-none',
  NOTA_POPUP_MOTION_CLASS,
  // Dismiss faster than it opens, like native popovers.
  'data-[ending-style]:duration-150',
);

/** Popover root (open state + a11y wiring). */
export const Popover = BasePopover.Root;

/** Button that opens the popover. */
export const PopoverTrigger = BasePopover.Trigger;

/** Portal for the positioner. */
export const PopoverPortal = BasePopover.Portal;

/** Closes the popover when activated. */
export const PopoverClose = BasePopover.Close;

export function PopoverPositioner({
  className,
  sideOffset = 8,
  ...props
}: PopoverPositionerProps) {
  return (
    <BasePopover.Positioner
      data-slot="popover-positioner"
      className={cn('z-50', className)}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export function PopoverPopup({ className, ...props }: PopoverPopupProps) {
  return (
    <BasePopover.Popup
      data-slot="popover-popup"
      className={cn(DEFAULT_POPUP_CLASS, className)}
      {...props}
    />
  );
}

export type PopoverContentProps = PopoverPopupProps &
  Pick<PopoverPositionerProps, 'side' | 'align' | 'sideOffset' | 'alignOffset'>;

/**
 * Portaled positioner + popup surface. Pass `className` to override width.
 */
export function PopoverContent({
  className,
  children,
  side,
  align,
  sideOffset,
  alignOffset,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortal>
      <PopoverPositioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <PopoverPopup className={className} {...props}>
          {children}
        </PopoverPopup>
      </PopoverPositioner>
    </PopoverPortal>
  );
}

export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title
      data-slot="popover-title"
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      data-slot="popover-description"
      className={cn('text-xs/relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

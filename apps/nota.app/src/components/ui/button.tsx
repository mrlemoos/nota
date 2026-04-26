import * as React from 'react';
import type { ButtonProps } from '@base-ui/react/button';
import {
  Button as WebDesignButton,
  buttonVariants,
} from '@nota.app/web-design/button';
import type { VariantProps } from 'class-variance-authority';

import {
  gsap,
  NOTA_BUTTON_PRESS_S,
  NOTA_BUTTON_RELEASE_S,
  NOTA_MOTION_EASE_OUT,
  usePrefersReducedMotion,
} from '@/lib/nota-motion';

export { buttonVariants };

function mergeButtonRefs<T extends HTMLElement>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    }
  };
}

type ButtonPointerArg = Parameters<
  NonNullable<ButtonProps['onPointerDown']>
>[0];

const Button = React.forwardRef(function Button(
  {
    className,
    variant = 'default',
    size = 'default',
    disabled,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    ...props
  }: ButtonProps & VariantProps<typeof buttonVariants>,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionRef = React.useRef<HTMLElement | null>(null);

  const releasePress = React.useCallback(() => {
    const el = motionRef.current;
    if (!el || prefersReducedMotion) {
      return;
    }
    gsap.to(el, {
      scale: 1,
      duration: NOTA_BUTTON_RELEASE_S,
      ease: NOTA_MOTION_EASE_OUT,
      overwrite: 'auto',
    });
  }, [prefersReducedMotion]);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPointerDown?.(e as unknown as ButtonPointerArg);
      if (e.defaultPrevented || prefersReducedMotion || disabled) {
        return;
      }
      if (e.button !== 0) {
        return;
      }
      const el = motionRef.current;
      if (!el) {
        return;
      }
      gsap.to(el, {
        scale: 0.99,
        duration: NOTA_BUTTON_PRESS_S,
        ease: NOTA_MOTION_EASE_OUT,
        overwrite: 'auto',
      });
    },
    [disabled, onPointerDown, prefersReducedMotion],
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPointerUp?.(e as unknown as ButtonPointerArg);
      releasePress();
    },
    [onPointerUp, releasePress],
  );

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPointerLeave?.(e as unknown as ButtonPointerArg);
      releasePress();
    },
    [onPointerLeave, releasePress],
  );

  const handlePointerCancel = React.useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onPointerCancel?.(e as unknown as ButtonPointerArg);
      releasePress();
    },
    [onPointerCancel, releasePress],
  );

  return (
    <WebDesignButton
      ref={mergeButtonRefs(forwardedRef, motionRef)}
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button };

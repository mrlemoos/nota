import { forwardRef, useImperativeHandle } from 'react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types.js';
import { gateIconHover } from '../lib/icon-hover-motion.js';
import { motion, useAnimate } from 'motion/react';

/** Corner brackets that pull inward on hover — "give the page back". */
const MinimizeIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = 'currentColor', strokeWidth = 2, className = '' },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = () => {
      const options = { duration: 0.3, ease: 'easeOut' } as const;
      animate('.corner-tl', { x: 1.5, y: 1.5 }, options);
      animate('.corner-tr', { x: -1.5, y: 1.5 }, options);
      animate('.corner-br', { x: -1.5, y: -1.5 }, options);
      animate('.corner-bl', { x: 1.5, y: -1.5 }, options);
    };

    const stop = () => {
      const options = { duration: 0.2, ease: 'easeOut' } as const;
      animate('.corner-tl', { x: 0, y: 0 }, options);
      animate('.corner-tr', { x: 0, y: 0 }, options);
      animate('.corner-br', { x: 0, y: 0 }, options);
      animate('.corner-bl', { x: 0, y: 0 }, options);
    };

    useImperativeHandle(ref, () => {
      return {
        startAnimation: start,
        stopAnimation: stop,
      };
    });

    const handleHoverStart = () => {
      start();
    };

    const handleHoverEnd = () => {
      stop();
    };

    return (
      <motion.svg
        ref={scope}
        onHoverStart={gateIconHover(handleHoverStart)}
        onHoverEnd={gateIconHover(handleHoverEnd)}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
        style={{ overflow: 'visible' }}
      >
        <motion.path className="corner-tl" d="M9 3v3a2 2 0 0 1-2 2H4" />
        <motion.path className="corner-tr" d="M15 3v3a2 2 0 0 0 2 2h3" />
        <motion.path className="corner-br" d="M15 21v-3a2 2 0 0 1 2-2h3" />
        <motion.path className="corner-bl" d="M9 21v-3a2 2 0 0 0-2-2H4" />
      </motion.svg>
    );
  },
);

MinimizeIcon.displayName = 'MinimizeIcon';

export default MinimizeIcon;

import { forwardRef, useImperativeHandle } from 'react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types.js';
import { gateIconHover } from '../lib/icon-hover-motion.js';
import { motion, useAnimate } from 'motion/react';

const XIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = 'currentColor', strokeWidth = 2, className = '' },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = () => {
      animate('.x-stroke', { rotate: 90 }, { duration: 0.3, ease: 'easeOut' });
    };

    const stop = () => {
      animate('.x-stroke', { rotate: 0 }, { duration: 0.2, ease: 'easeOut' });
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
        <motion.path
          className="x-stroke"
          d="M18 6L6 18"
          style={{ transformOrigin: 'center' }}
        />
        <motion.path
          className="x-stroke"
          d="M6 6l12 12"
          style={{ transformOrigin: 'center' }}
        />
      </motion.svg>
    );
  },
);

XIcon.displayName = 'XIcon';

export default XIcon;

"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

/**
 * Wraps content in a container that tilts in 3D toward the cursor on hover,
 * giving cards a tactile, "floating" feel. Resets smoothly when the cursor leaves.
 */
export default function TiltCard({
  children,
  className = "",
  intensity = 10,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [intensity, -intensity]),
    { stiffness: 200, damping: 18 }
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-intensity, intensity]),
    { stiffness: 200, damping: 18 }
  );

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const style: CSSProperties & {
    rotateX: typeof rotateX;
    rotateY: typeof rotateY;
    transformPerspective: number;
  } = {
    rotateX,
    rotateY,
    transformPerspective: 900,
  };

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

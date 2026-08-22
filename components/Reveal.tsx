"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Transform-only reveal: content is always fully opaque, so it can
 * never be caught mid-animation looking invisible or washed out
 * (opacity-based reveals did exactly that on fast scrolls/loads).
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ y: 16 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

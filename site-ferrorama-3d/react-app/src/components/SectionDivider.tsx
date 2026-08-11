import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

interface SectionDividerProps {
  number: string | number;
}

export default function SectionDivider({ number }: SectionDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div className="section-divider" ref={ref}>
      <motion.div
        className="divider-line"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      />
      <motion.span
        className="divider-number"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT_EXPO }}
      >
        {number}
      </motion.span>
      <motion.div
        className="divider-line"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.1 }}
      />
    </div>
  );
}

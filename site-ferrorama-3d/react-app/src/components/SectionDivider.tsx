import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE_OUT_EXPO } from '../lib/motion';

/** Divisor visual entre seções — linha só (números ficam no header de cada seção). */
export default function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div className="section-divider" ref={ref} aria-hidden="true">
      <motion.div
        className="divider-line"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      />
    </div>
  );
}

import { AnchorHTMLAttributes, ReactNode } from 'react';

interface CtaLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

/**
 * Botão de chamada para ação.
 *
 * Substitui o antigo MagneticButton, que rodava um spring do Framer Motion e
 * um handler de mousemove por botão — três instâncias só no hero, todas
 * recalculando getBoundingClientRect a cada movimento do mouse. O destaque de
 * hover agora é uma transição de CSS, que roda no compositor.
 */
export default function CtaLink({ children, className, ...props }: CtaLinkProps) {
  return (
    <a className={className} {...props}>
      {children}
    </a>
  );
}

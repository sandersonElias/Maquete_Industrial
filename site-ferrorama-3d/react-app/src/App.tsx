import { useEffect } from 'react';
import Lenis from 'lenis';
import Loader from './components/Loader';
import Particles from './components/Particles';
import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import SectionDivider from './components/SectionDivider';
import MontagemSection from './components/MontagemSection';
import CodigoSection from './components/CodigoSection';
import PortoSection from './components/PortoSection';
import MinaSection from './components/MinaSection';
import ControleSection from './components/ControleSection';
import MaqueteSvgSection from './components/MaqueteSvgSection';

import Footer from './components/Footer';
import useScrollAnimations from './hooks/useScrollAnimations';

export default function App() {
  useScrollAnimations();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <>
      <Loader />
      <CustomCursor />
      <Particles />
      <Navigation />

      {/* Section 00: Hero / Início */}
      <HeroSection />

      <SectionDivider number="01" />

      {/* Section 01: Maquete Interativa */}
      <MaqueteSvgSection />

      <SectionDivider number="02" />

      {/* Section 02: Montagem */}
      <MontagemSection />

      <SectionDivider number="03" />

      {/* Section 03: Código & Automação */}
      <CodigoSection />

      <SectionDivider number="04" />

      {/* Section 04: Porto & Aeroporto */}
      <PortoSection />

      <SectionDivider number="05" />

      {/* Section 05: Mina de Ferro */}
      <MinaSection />

      <SectionDivider number="06" />

      {/* Section 06: Central de Controle */}
      <ControleSection />

      <Footer />
    </>
  );
}

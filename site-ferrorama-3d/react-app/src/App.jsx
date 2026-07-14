import { useEffect } from 'react';
import Lenis from 'lenis';
import Loader from './components/Loader';
import Particles from './components/Particles';
import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import SectionDivider from './components/SectionDivider';
import MontagemSection from './components/MontagemSection';
import MaqueteSection from './components/MaqueteSection';
import CodigoSection from './components/CodigoSection';
import PortoSection from './components/PortoSection';
import MinaSection from './components/MinaSection';
import ControleSection from './components/ControleSection';
import Footer from './components/Footer';
import useScrollAnimations from './hooks/useScrollAnimations';

export default function App() {
  useScrollAnimations();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
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
      <HeroSection />
      <SectionDivider number="00" />
      <MontagemSection />
      <SectionDivider number="01" />
      <MaqueteSection />
      <SectionDivider number="02" />
      <CodigoSection />
      <SectionDivider number="03" />
      <PortoSection />
      <SectionDivider number="04" />
      <MinaSection />
      <SectionDivider number="05" />
      <ControleSection />
      <Footer />
    </>
  );
}

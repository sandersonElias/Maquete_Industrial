import Loader from './components/Loader';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import SectionDivider from './components/SectionDivider';
import MaqueteSection from './components/MaqueteSection';
import MontagemSection from './components/MontagemSection';
import CodigoSection from './components/CodigoSection';
import PortoSection from './components/PortoSection';
import MinaSection from './components/MinaSection';
import ControleSection from './components/ControleSection';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import PageRails from './components/PageRails';
import useScrollAnimations from './hooks/useScrollAnimations';

export default function App() {
  useScrollAnimations();

  return (
    <>
      {/* Primeiro item focável: permite pular a navegação com o teclado */}
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>

      <Loader />
      <PageRails />
      <Navigation />

      <main id="conteudo">
        {/* Section 00: Hero / Início */}
        <HeroSection />

        <SectionDivider />

        {/* Section 01: Maquete 3D interativa */}
        <MaqueteSection />

        <SectionDivider />

        {/* Section 02: Montagem */}
        <MontagemSection />

        <SectionDivider />

        {/* Section 03: Código & Automação */}
        <CodigoSection />

        <SectionDivider />

        {/* Section 04: Porto & Aeroporto */}
        <PortoSection />

        <SectionDivider />

        {/* Section 05: Mina de Ferro */}
        <MinaSection />

        <SectionDivider />

        {/* Section 06: Central de Controle */}
        <ControleSection />
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}

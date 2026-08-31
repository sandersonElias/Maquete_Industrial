import Loader from './components/Loader';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import SectionDivider from './components/SectionDivider';
import MaqueteSection from './components/MaqueteSection';
import PreparacaoSection from './components/PreparacaoSection';
import MontagemSection from './components/MontagemSection';
import CodigoSection from './components/CodigoSection';
import PortoSection from './components/PortoSection';
import MinaSection from './components/MinaSection';
import ControleSection from './components/ControleSection';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import PageRails from './components/PageRails';
import MaquetePage from './components/MaquetePage';
import PullToRefresh from './components/PullToRefresh';

export default function App() {
  const soMaquete =
    typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/maquete';

  if (soMaquete) {
    return (
      <>
        <PullToRefresh />
        <MaquetePage />
      </>
    );
  }

  return <Site />;
}

function Site() {
  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>

      <PullToRefresh />
      <Loader />
      <PageRails />
      <Navigation />

      <main id="conteudo">
        <HeroSection />

        <SectionDivider />

        <MaqueteSection />

        <SectionDivider />

        {/* Section 02: Preparação do projeto */}
        <PreparacaoSection />

        <SectionDivider />

        {/* Section 03: Montagem */}
        <MontagemSection />

        <SectionDivider />

        {/* Section 04: Código & Automação */}
        <CodigoSection />

        <SectionDivider />

        {/* Section 05: Mina de Ferro */}
        <MinaSection />

        <SectionDivider />

        {/* Section 06: Porto */}
        <PortoSection />

        <SectionDivider />

        {/* Section 07: Central de Controle */}
        <ControleSection />
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}

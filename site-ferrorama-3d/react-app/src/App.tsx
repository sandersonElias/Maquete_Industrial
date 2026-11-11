import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
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
import { scrollToSection } from './lib/scroll';

export default function App() {
  const soMaquete =
    typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/maquete';

  // `reducedMotion="user"` faz o Framer Motion respeitar a preferência do sistema
  // numa passada só: sem ele, todo `initial/animate` com transform rodava mesmo
  // com "reduzir movimento" ligado, porque o CSS não alcança o que o JS anima.
  return (
    <MotionConfig reducedMotion="user">
      {soMaquete ? (
        <>
          <PullToRefresh />
          <MaquetePage />
        </>
      ) : (
        <Site />
      )}
    </MotionConfig>
  );
}

function Site() {
  useEffect(() => {
    const idDoHash = () => window.location.hash.replace(/^#/, '');

    const aoVoltar = () => {
      const id = idDoHash();
      // 'inicio' também no hash vazio: ele cancela a correção pendente da
      // seção anterior, que do contrário puxava a página de volta.
      scrollToSection(id || 'inicio', { historico: 'nenhum' });
    };

    // O loader trava o scroll durante o carregamento — e é justamente nesse
    // intervalo que o navegador tenta rolar até a seção da URL. Ao liberar,
    // se o hash manda numa seção, refaz o alvo.
    const aoLiberar = () => {
      const id = idDoHash();
      if (id && document.getElementById(id)) {
        scrollToSection(id, { historico: 'nenhum' });
      }
    };

    window.addEventListener('popstate', aoVoltar);
    window.addEventListener('scroll-liberado', aoLiberar);
    return () => {
      window.removeEventListener('popstate', aoVoltar);
      window.removeEventListener('scroll-liberado', aoLiberar);
    };
  }, []);

  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>

      <PullToRefresh />
      <Loader />
      <PageRails />
      <Navigation />

      {/* tabIndex="-1" dá destino de foco ao skip-link (âncora sozinha só rola). */}
      <main id="conteudo" tabIndex={-1}>
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

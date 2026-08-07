import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import MenuToggle from './components/MenuToggle';
import BackToTop from './components/BackToTop';
import Inicio from './components/sections/Inicio';
import Montagem from './components/sections/Montagem';
import Maquete from './components/sections/Maquete';
import Codigo from './components/sections/Codigo';
import PortoAeroporto from './components/sections/PortoAeroporto';
import Mina from './components/sections/Mina';
import Controle from './components/sections/Controle';
import { SECTION_IDS, getSectionTitle } from './constants';

function readHash() {
  const id = window.location.hash.slice(1).split('?')[0];
  return SECTION_IDS.includes(id) ? id : 'inicio';
}

export default function App() {
  const [section, setSection] = useState(readHash);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useCallback((id) => {
    const target = SECTION_IDS.includes(id) ? id : 'inicio';
    setSection(target);
    setMenuOpen(false);
    document.title = getSectionTitle(target);
    window.history.replaceState(null, '', `#${target}`);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.title = getSectionTitle(section);

    const onHashChange = () => navigate(readHash());
    window.addEventListener('hashchange', onHashChange);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    return () => window.removeEventListener('hashchange', onHashChange);
  }, [navigate, section]);

  return (
    <>
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <MenuToggle open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
      <Sidebar
        open={menuOpen}
        active={section}
        onNavigate={navigate}
      />

      <main className="content" id="main-content">
        {section === 'inicio' && <Inicio onNavigate={navigate} />}
        {section === 'montagem' && <Montagem onNavigate={navigate} />}
        {section === 'maquete' && <Maquete onNavigate={navigate} />}
        {section === 'codigo' && <Codigo onNavigate={navigate} />}
        {section === 'porto-aeroporto' && <PortoAeroporto onNavigate={navigate} />}
        {section === 'mina' && <Mina onNavigate={navigate} />}
        {section === 'controle' && <Controle onNavigate={navigate} />}
      </main>

      <BackToTop />
    </>
  );
}

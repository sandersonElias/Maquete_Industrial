(function () {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.querySelectorAll('.nav-link, .home-card, .section-nav-btn');
  const sections = document.querySelectorAll('.section');
  const backToTop = document.getElementById('backToTop');

  const sectionTitles = {
    inicio: 'Ferrorama — Documentação',
    maquete: 'A Maquete — Ferrorama',
    montagem: 'Montagem — Ferrorama',
    codigo: 'Código e automação — Ferrorama',
    'porto': 'Porto — Ferrorama',
    mina: 'Mina de ferro — Ferrorama',
    controle: 'Central de controle — Ferrorama',
  };

  function showSection(id) {
    const target = id || 'inicio';

    sections.forEach((section) => {
      section.classList.toggle('active', section.id === target);
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.section === target);
    });

    document.title = sectionTitles[target] || sectionTitles.inicio;
    history.replaceState(null, '', `#${target}`);
    window.scrollTo(0, 0);
  }

  function handleNavClick(event) {
    const link = event.currentTarget;
    const sectionId = link.dataset.section;
    if (!sectionId) return;

    event.preventDefault();
    showSection(sectionId);
    sidebar.classList.remove('open');
    menuToggle.classList.remove('open');
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', handleNavClick);
  });

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    menuToggle.classList.toggle('open');
  });

  document.querySelector('.sidebar-header')?.addEventListener('click', () => {
    showSection('inicio');
  });

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (document.getElementById(id)) {
      showSection(id);
    }
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      const container = btn.closest('.section');

      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId)?.classList.add('active');
    });
  });

  window.addEventListener('scroll', () => {
    if (backToTop) {
      backToTop.hidden = window.scrollY < 400;
    }
  }, { passive: true });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  const hash = location.hash.slice(1);
  const initial = hash.split('?')[0];
  showSection(document.getElementById(initial) ? initial : 'inicio');

  const panelItems = document.querySelectorAll('.panel-item');
  let panelIndex = 0;

  if (panelItems.length) {
    setInterval(() => {
      panelItems.forEach((item) => item.classList.remove('active'));
      panelItems[panelIndex].classList.add('active');
      panelIndex = (panelIndex + 1) % panelItems.length;
    }, 3000);
  }
})();

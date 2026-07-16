(function () {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.querySelectorAll('.nav-link, .home-card, .section-nav-btn');
  const sections = document.querySelectorAll('.section');
  const backToTop = document.getElementById('backToTop');
  const progressBar = document.getElementById('progressBar');

  const sectionTitles = {
    inicio: 'Ferrorama — Documentação',
    maquete: 'A Maquete — Ferrorama',
    montagem: 'Montagem — Ferrorama',
    codigo: 'Código e automação — Ferrorama',
    'porto-aeroporto': 'Porto e aeroporto — Ferrorama',
    mina: 'Mina de ferro — Ferrorama',
    controle: 'Central de controle — Ferrorama',
  };

  /* ─── Section navigation ─── */
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

    // Trigger scroll reveal for newly visible section
    requestAnimationFrame(() => {
      initScrollReveal();
    });
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

  /* ─── Tabs ─── */
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

  /* ─── Back to top & progress bar ─── */
  window.addEventListener('scroll', () => {
    if (backToTop) {
      backToTop.hidden = window.scrollY < 400;
    }
    // Progress bar
    if (progressBar) {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }
  }, { passive: true });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ─── Service worker ─── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  /* ─── Initial section ─── */
  const hash = location.hash.slice(1);
  const initial = hash.split('?')[0];
  showSection(document.getElementById(initial) ? initial : 'inicio');

  /* ─── Panel animation ─── */
  const panelItems = document.querySelectorAll('.panel-item');
  let panelIndex = 0;

  if (panelItems.length) {
    setInterval(() => {
      panelItems.forEach((item) => item.classList.remove('active'));
      panelItems[panelIndex].classList.add('active');
      panelIndex = (panelIndex + 1) % panelItems.length;
    }, 3000);
  }

  /* ─── Scroll reveal ─── */
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '.spec-item, .home-card, .card, .objective-item, .content-block, ' +
      '.timeline-item, .step-card, .process-step, .mini-card, .stat, ' +
      '.control-feature, .glossary-item, .chip, .callout, .logistics-flow'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal', 'visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach((el, index) => {
      // Only add reveal class if not already visible
      if (!el.classList.contains('visible')) {
        el.classList.add('reveal');
        // Stagger delay based on position
        const delayClass = `reveal-delay-${Math.min((index % 4) + 1, 4)}`;
        el.classList.add(delayClass);
        observer.observe(el);
      }
    });
  }

  // Initialize on load
  requestAnimationFrame(() => {
    initScrollReveal();
  });

  /* ─── Keyboard navigation ─── */
  document.addEventListener('keydown', (e) => {
    // Escape closes mobile menu
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.focus();
    }
  });

  /* ─── Smooth hover effects for cards ─── */
  document.querySelectorAll('.card, .home-card, .spec-item').forEach((card) => {
    card.addEventListener('mouseenter', function () {
      this.style.willChange = 'transform';
    });
    card.addEventListener('mouseleave', function () {
      this.style.willChange = 'auto';
    });
  });
})();

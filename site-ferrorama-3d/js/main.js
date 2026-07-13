/* ============================================
   MAIN.JS - Core Functionality + Train Control
   ============================================ */

class FerroramaApp {
  constructor() {
    this.loader = document.getElementById('loader');
    this.nav = document.getElementById('nav');
    this.menuBtn = document.getElementById('menuBtn');
    this.mobileMenu = document.getElementById('mobileMenu');
    this.navLinks = document.querySelectorAll('.nav-link, .mobile-link');
    this.sections = document.querySelectorAll('.section');
    this.particlesCanvas = document.getElementById('particles');

    this.maquetteScene = null;
    this.minaScene = null;

    this.init();
  }

  init() {
    window.addEventListener('load', () => {
      setTimeout(() => this.loader.classList.add('hidden'), 1500);
    });

    this.setupNavigation();
    this.setupMobileMenu();
    this.setupScrollSpy();
    this.initParticles();
    this.init3DScenes();
    this.setupMaqueteControls();
    this.setupTrainPanel();
    this.setupSmoothScroll();
  }

  setupNavigation() {
    window.addEventListener('scroll', () => {
      this.nav.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  setupMobileMenu() {
    this.menuBtn.addEventListener('click', () => {
      this.mobileMenu.classList.toggle('active');
      this.menuBtn.classList.toggle('active');
    });

    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.mobileMenu.classList.remove('active');
        this.menuBtn.classList.remove('active');
      });
    });
  }

  setupScrollSpy() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          this.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
          });
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.3 });

    this.sections.forEach(section => observer.observe(section));
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
        }
      });
    });
  }

  initParticles() {
    if (!this.particlesCanvas) return;

    const ctx = this.particlesCanvas.getContext('2d');
    let particles = [];
    let animationId;

    const resize = () => {
      this.particlesCanvas.width = window.innerWidth;
      this.particlesCanvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '#00d4ff' : '#00ffb2';
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > window.innerWidth || this.y < 0 || this.y > window.innerHeight) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, this.particlesCanvas.width, this.particlesCanvas.height);
      particles.forEach(p => { p.update(); p.draw(); });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = '#00d4ff';
            ctx.globalAlpha = 0.1 * (1 - dist / 150);
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animationId);
      else animate();
    });
  }

  init3DScenes() {
    // Initialize immediately — the scene works even if the section is off-screen
    // because MaquetteScene handles fallback dimensions
    this._initMaquetteScene();

    const minaSection = document.getElementById('mina');
    if (minaSection) {
      const minaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.minaScene) {
            this._initMinaScene();
            minaObserver.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      minaObserver.observe(minaSection);
    }
  }

  _initMaquetteScene() {
    if (this.maquetteScene) return;
    const container = document.getElementById('maquete3d');
    if (!container) return;

    try {
      this.maquetteScene = new MaquetteScene('maquete3d');
      this.maquetteScene.onTrainAdded = (train) => this.addTrainCard(train);
      this.maquetteScene.onTrainRemoved = (id) => this.removeTrainCard(id);
      this.maquetteScene.onTrainToggled = (train) => this.updateTrainCardState(train);
      this.maquetteScene.onTrainPlaced = () => this.onTrainPlaced();
      this.maquetteScene.onAllTrainsToggled = (running) => this.onAllTrainsToggled(running);
      this.maquetteScene.onReversorToggled = (state) => this.onReversorToggled(state);
      this.maquetteScene.onSwitchToggled = (label, state) => this.onSwitchToggled(label, state);
      console.log('Maquette 3D initialized successfully');

      // Spawn default trains AFTER callbacks are connected
      this.maquetteScene._spawnDefaultTrains();
    } catch (e) {
      console.error('Error initializing maquette:', e);
      setTimeout(() => this._initMaquetteScene(), 500);
    }
  }

  _initMinaScene() {
    if (this.minaScene) return;
    const container = document.getElementById('mina3d');
    if (!container) return;

    try {
      this.minaScene = new MaquetteScene('mina3d');
      if (this.minaScene.camera) {
        this.minaScene.camera.position.set(-8, 5, 2);
        this.minaScene.controls.target.set(-5, 1, -2);
      }
    } catch (e) {
      console.error('Error initializing mina scene:', e);
    }
  }

  setupMaqueteControls() {
    const controlBtns = document.querySelectorAll('.control-btn');
    const maqueteInfo = document.getElementById('maqueteInfo');

    const infoContent = {
      overview: {
        title: 'Visão Geral',
        text: 'Layout rectangular com circuitos interno e externo, viaduto elevado e eletrônicos Arduino. Base de MDF com trilhos escala HO.'
      },
      mina: {
        title: 'Área de Eletrônicos',
        text: 'Breadboard, Arduino Mega e fios de conexão para controle dos switches e do trem.'
      },
      porto: {
        title: 'Seção Elevada',
        text: 'Viaduto com pilares de concreto, cruzando sobre o circuito interno com trilhos elevados.'
      },
      trem: {
        title: 'Trem & Chaveamentos',
        text: 'Locomotivas com diferentes cores, chaveamentos amarelos para troca de trilhos nos cruzamentos.'
      }
    };

    controlBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        controlBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        if (maqueteInfo && infoContent[view]) {
          maqueteInfo.querySelector('h3').textContent = infoContent[view].title;
          maqueteInfo.querySelector('p').textContent = infoContent[view].text;
        }
        if (this.maquetteScene) this.maquetteScene.animateToView(view);
      });
    });

    if (controlBtns.length > 0) controlBtns[0].classList.add('active');
  }

  // ==========================================
  // TRAIN PANEL UI
  // ==========================================
  setupTrainPanel() {
    // Panel toggle
    const panelToggle = document.getElementById('panelToggle');
    const panelBody = document.getElementById('trainPanelBody');
    if (panelToggle && panelBody) {
      panelToggle.addEventListener('click', () => {
        panelBody.classList.toggle('collapsed');
        panelToggle.textContent = panelBody.classList.contains('collapsed') ? '+' : '—';
      });
    }

    // Train type selection
    const typeButtons = document.querySelectorAll('.train-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Add train button
    const btnAddTrain = document.getElementById('btnAddTrain');
    if (btnAddTrain) {
      btnAddTrain.addEventListener('click', () => {
        if (!this.maquetteScene) return;
        const activeType = document.querySelector('.train-type-btn.active');
        const typeIndex = activeType ? parseInt(activeType.dataset.type) : 0;
        const hint = document.getElementById('placementHint');

        if (this.maquetteScene.placementMode) {
          // Cancel placement mode
          this.maquetteScene.setPlacementMode(false);
          btnAddTrain.classList.remove('placing');
          btnAddTrain.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Adicionar ao trilho
          `;
          if (hint) hint.style.display = 'none';
        } else {
          // Enter placement mode
          this.maquetteScene.setPlacementMode(true, typeIndex);
          btnAddTrain.classList.add('placing');
          btnAddTrain.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Cancelar
          `;
          if (hint) hint.style.display = 'flex';
        }
      });
    }

    // Start all / Stop all
    const btnStartAll = document.getElementById('btnStartAll');
    const btnStopAll = document.getElementById('btnStopAll');
    if (btnStartAll) {
      btnStartAll.addEventListener('click', () => {
        if (this.maquetteScene) this.maquetteScene.startAllTrains();
      });
    }
    if (btnStopAll) {
      btnStopAll.addEventListener('click', () => {
        if (this.maquetteScene) this.maquetteScene.stopAllTrains();
      });
    }

    // Global speed
    const globalSpeed = document.getElementById('globalSpeed');
    const globalSpeedVal = document.getElementById('globalSpeedVal');
    if (globalSpeed) {
      globalSpeed.addEventListener('input', () => {
        const speed = parseFloat(globalSpeed.value);
        if (this.maquetteScene) {
          this.maquetteScene.trains.forEach(t => {
            t.targetSpeed = speed;
            // Update individual slider
            const slider = document.querySelector(`.train-card[data-id="${t.id}"] input[type="range"]`);
            if (slider) slider.value = speed;
            const valSpan = document.querySelector(`.train-card[data-id="${t.id}"] .speed-val`);
            if (valSpan) valSpan.textContent = Math.round((speed / 0.1) * 100) + '%';
          });
        }
        globalSpeedVal.textContent = Math.round((speed / 0.1) * 100) + '%';
      });
    }
  }

  // ==========================================
  // TRAIN CARD UI MANAGEMENT
  // ==========================================
  addTrainCard(trainData) {
    const list = document.getElementById('trainList');
    const empty = document.getElementById('trainListEmpty');
    if (empty) empty.style.display = 'none';

    const card = document.createElement('div');
    card.className = 'train-card';
    card.dataset.id = trainData.id;

    const colorHex = '#' + trainData.color.body.toString(16).padStart(6, '0');

    card.innerHTML = `
      <div class="train-color-dot" style="background:${colorHex};color:${colorHex}"></div>
      <div class="train-card-info">
        <div class="train-card-name">${trainData.name}</div>
        <div class="train-card-type">${trainData.color.name} · ${trainData.type.cars} vagões</div>
        <div class="train-card-speed">
          <input type="range" min="0.005" max="0.1" step="0.005" value="${trainData.targetSpeed}">
          <span class="speed-val">30%</span>
        </div>
      </div>
      <div class="train-card-controls">
        <button class="train-btn btn-play" title="Iniciar/Parar">▶</button>
        <button class="train-btn btn-reverse" title="Inverter">⟲</button>
        <button class="train-btn btn-delete" title="Remover">✕</button>
      </div>
    `;

    // Play/Pause
    const playBtn = card.querySelector('.btn-play');
    playBtn.addEventListener('click', () => {
      if (this.maquetteScene) this.maquetteScene.toggleTrainRunning(trainData.id);
    });

    // Reverse
    const reverseBtn = card.querySelector('.btn-reverse');
    reverseBtn.addEventListener('click', () => {
      if (this.maquetteScene) this.maquetteScene.reverseTrain(trainData.id);
    });

    // Delete
    const deleteBtn = card.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', () => {
      if (this.maquetteScene) this.maquetteScene.removeTrain(trainData.id);
    });

    // Speed slider
    const slider = card.querySelector('input[type="range"]');
    const speedVal = card.querySelector('.speed-val');
    slider.addEventListener('input', () => {
      const speed = parseFloat(slider.value);
      speedVal.textContent = Math.round((speed / 0.1) * 100) + '%';
      if (this.maquetteScene) this.maquetteScene.setTrainSpeed(trainData.id, speed);
    });

    list.appendChild(card);
    this.updateTrainCountBadge();
  }

  removeTrainCard(id) {
    const card = document.querySelector(`.train-card[data-id="${id}"]`);
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateX(20px)';
      card.style.transition = 'all 0.3s ease';
      setTimeout(() => card.remove(), 300);
    }

    const list = document.getElementById('trainList');
    const empty = document.getElementById('trainListEmpty');
    setTimeout(() => {
      if (list && list.querySelectorAll('.train-card').length <= 1) {
        if (empty) empty.style.display = 'block';
      }
    }, 350);

    this.updateTrainCountBadge();
  }

  updateTrainCardState(train) {
    const card = document.querySelector(`.train-card[data-id="${train.id}"]`);
    if (!card) return;

    if (train.running) {
      card.classList.add('running');
      const playBtn = card.querySelector('.btn-play');
      playBtn.innerHTML = '⏸';
      playBtn.title = 'Parar';
    } else {
      card.classList.remove('running');
      const playBtn = card.querySelector('.btn-play');
      playBtn.innerHTML = '▶';
      playBtn.title = 'Iniciar';
    }
  }

  onTrainPlaced() {
    const btnAddTrain = document.getElementById('btnAddTrain');
    if (btnAddTrain) {
      btnAddTrain.classList.remove('placing');
      btnAddTrain.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Adicionar ao trilho
      `;
    }
    const hint = document.getElementById('placementHint');
    if (hint) hint.style.display = 'none';
    this.updateTrainCountBadge();
  }

  onAllTrainsToggled(running) {
    if (!this.maquetteScene) return;
    this.maquetteScene.trains.forEach(train => {
      this.updateTrainCardState(train);
    });
  }

  updateTrainCountBadge() {
    const count = this.maquetteScene ? this.maquetteScene.getTrainCount() : 0;
    const running = this.maquetteScene ? this.maquetteScene.getRunningCount() : 0;
    const panelTitle = document.querySelector('.train-panel-header h3');
    if (panelTitle) {
      const icon = `<span class="train-panel-icon">🚂</span>`;
      panelTitle.innerHTML = `${icon} Controle de Trens <span style="font-weight:400;font-size:0.8rem;color:var(--text-muted)">(${count})</span>`;
    }
  }

  // ==========================================
  // REVERSOR & SWITCH UI
  // ==========================================
  onReversorToggled(state) {
    const info = document.getElementById('maqueteInfo');
    if (info) {
      const color = state === 'red' ? '#ff4444' : '#44ff44';
      const label = state === 'red' ? 'REVERSO' : 'FRENTE';
      info.querySelector('h3').innerHTML = `Reversor <span style="color:${color};font-size:0.8em">${label}</span>`;
      info.querySelector('p').textContent = state === 'red'
        ? 'Reversor ativo — trens em movimento inverteram o sentido.'
        : 'Reversor normal — trens circulando no sentido padrão.';
    }
  }

  onSwitchToggled(label, state) {
    const info = document.getElementById('maqueteInfo');
    if (info) {
      const dir = state === 'left' ? 'Esquerda' : 'Direita';
      info.querySelector('h3').textContent = `Chaveamento ${label}`;
      info.querySelector('p').textContent = `Alterado para ${dir}. Alavanca movida.`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new FerroramaApp();
});

window.FerroramaApp = FerroramaApp;

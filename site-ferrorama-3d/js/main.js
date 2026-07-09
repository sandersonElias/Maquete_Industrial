/* ============================================
   MAIN.JS - Core Functionality
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
    // Hide loader
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.loader.classList.add('hidden');
      }, 1500);
    });
    
    // Setup navigation
    this.setupNavigation();
    
    // Setup mobile menu
    this.setupMobileMenu();
    
    // Setup scroll spy
    this.setupScrollSpy();
    
    // Initialize particles
    this.initParticles();
    
    // Initialize 3D scenes
    this.init3DScenes();
    
    // Setup maquete controls
    this.setupMaqueteControls();
    
    // Smooth scroll for anchor links
    this.setupSmoothScroll();
  }
  
  setupNavigation() {
    // Nav scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }
    });
  }
  
  setupMobileMenu() {
    this.menuBtn.addEventListener('click', () => {
      this.mobileMenu.classList.toggle('active');
      this.menuBtn.classList.toggle('active');
    });
    
    // Close menu on link click
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.mobileMenu.classList.remove('active');
        this.menuBtn.classList.remove('active');
      });
    });
  }
  
  setupScrollSpy() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          
          // Update nav links
          this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);
    
    this.sections.forEach(section => {
      observer.observe(section);
    });
  }
  
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          const offsetTop = target.offsetTop - 70;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
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
      constructor() {
        this.reset();
      }
      
      reset() {
        this.x = Math.random() * this.particlesCanvas.width;
        this.y = Math.random() * this.particlesCanvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '#00d4ff' : '#00ffb2';
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > this.particlesCanvas.width ||
            this.y < 0 || this.y > this.particlesCanvas.height) {
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
    
    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push(new Particle());
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, this.particlesCanvas.width, this.particlesCanvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = '#00d4ff';
            ctx.globalAlpha = 0.1 * (1 - distance / 150);
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
    
    // Pause when not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });
  }
  
  init3DScenes() {
    // Wait for DOM to be fully rendered
    setTimeout(() => {
      // Main maquette scene
      const maqueteContainer = document.getElementById('maquete3d');
      if (maqueteContainer && maqueteContainer.clientWidth > 0) {
        try {
          this.maquetteScene = new MaquetteScene('maquete3d');
          console.log('Maquette 3D initialized successfully');
        } catch (e) {
          console.error('Error initializing maquette:', e);
        }
      } else {
        console.warn('Maquete container not found or has no width');
      }
      
      // Mina scene
      const minaContainer = document.getElementById('mina3d');
      if (minaContainer && minaContainer.clientWidth > 0) {
        try {
          this.minaScene = new MaquetteScene('mina3d');
          // Position camera for mina view
          if (this.minaScene.camera) {
            this.minaScene.camera.position.set(-8, 5, 2);
            this.minaScene.controls.target.set(-5, 1, -2);
          }
        } catch (e) {
          console.error('Error initializing mina scene:', e);
        }
      }
    }, 500);
  }
  
  setupMaqueteControls() {
    const controlBtns = document.querySelectorAll('.control-btn');
    const maqueteInfo = document.getElementById('maqueteInfo');
    
    const infoContent = {
      overview: {
        title: 'Visão Geral',
        text: 'Layout oval com ramais e seções elevadas. Base de MDF com trilhos escala HO e eletrônicos Arduino.'
      },
      mina: {
        title: 'Área de Eletrônicos',
        text: 'Breadboard, Arduino Mega e fios de conexão para controle dos switches e do trem.'
      },
      port: {
        title: 'Seção Elevada',
        text: 'Trilhos sobre suportes de cardboard, criando pontes e desníveis no percurso.'
      },
      trem: {
        title: 'Trem & Chaveamentos',
        text: 'Locomotiva azul com amarelo, chaveamentos para troca de trilhos.'
      }
    };
    
    controlBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        controlBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Get view name
        const view = btn.dataset.view;
        
        // Update info
        if (maqueteInfo && infoContent[view]) {
          maqueteInfo.querySelector('h3').textContent = infoContent[view].title;
          maqueteInfo.querySelector('p').textContent = infoContent[view].text;
        }
        
        // Animate camera
        if (this.maquetteScene) {
          this.maquetteScene.animateToView(view);
        }
      });
    });
    
    // Set default active
    if (controlBtns.length > 0) {
      controlBtns[0].classList.add('active');
    }
  }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  new FerroramaApp();
});

// Export for debugging
window.FerroramaApp = FerroramaApp;

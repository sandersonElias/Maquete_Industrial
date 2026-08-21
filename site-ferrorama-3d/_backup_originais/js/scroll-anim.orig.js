/* ============================================
   SCROLL ANIMATIONS - GSAP ScrollTrigger
   ============================================ */

class ScrollAnimations {
  constructor() {
    this.init();
  }
  
  init() {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);
    
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
    } else {
      this.setupAnimations();
    }
  }
  
  setupAnimations() {
    this.animateHero();
    this.animateSections();
    this.animateCards();
    this.animateCode();
    this.animatePorto();
    this.animateMina();
    this.animateDashboard();
  }
  
  animateHero() {
    // Title lines
    gsap.from('.title-line', {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 0.5
    });
    
    // Label
    gsap.from('.hero-label', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: 0.3
    });
    
    // Description
    gsap.from('.hero-description', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: 0.8
    });
    
    // Stats
    gsap.from('.stat-item', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      delay: 1
    });
    
    // CTA
    gsap.from('.hero-cta', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: 1.3
    });
    
    // Animate stat numbers
    this.animateCounters();
  }
  
  animateCounters() {
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
      const target = parseInt(stat.dataset.count);
      const obj = { value: 0 };
      
      gsap.to(obj, {
        value: target,
        duration: 2,
        delay: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          stat.textContent = Math.floor(obj.value);
        }
      });
    });
  }
  
  animateSections() {
    // Section headers
    gsap.utils.toArray('.section-header').forEach(header => {
      gsap.from(header, {
        scrollTrigger: {
          trigger: header,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });
    });
  }
  
  animateCards() {
    // Cards grid
    const cards = gsap.utils.toArray('.card');
    
    cards.forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 80,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power3.out'
      });
    });
  }
  
  animateCode() {
    // Code block
    gsap.from('.code-block', {
      scrollTrigger: {
        trigger: '.code-showcase',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      },
      x: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
    
    // Code features
    gsap.from('.feature-item', {
      scrollTrigger: {
        trigger: '.code-features',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });
    
    // Code typing effect
    this.typeCode();
  }
  
  typeCode() {
    const codeContent = document.querySelector('.code-content code');
    if (!codeContent) return;
    
    const originalHTML = codeContent.innerHTML;
    const text = codeContent.textContent;
    
    ScrollTrigger.create({
      trigger: '.code-block',
      start: 'top 70%',
      onEnter: () => {
        codeContent.innerHTML = '';
        let i = 0;
        
        const type = () => {
          if (i < text.length) {
            codeContent.textContent += text.charAt(i);
            i++;
            setTimeout(type, 20);
          } else {
            // Restore syntax highlighting
            codeContent.innerHTML = originalHTML;
          }
        };
        
        type();
      },
      once: true
    });
  }
  
  animatePorto() {
    // Porto image
    gsap.from('.porto-image', {
      scrollTrigger: {
        trigger: '.porto-showcase',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      },
      x: -80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
    
    // Porto items
    gsap.from('.porto-item', {
      scrollTrigger: {
        trigger: '.porto-content',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      x: 80,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    });
  }
  
  animateMina() {
    // Mina 3D
    gsap.from('.mina-3d', {
      scrollTrigger: {
        trigger: '.mina-showcase',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      },
      x: -80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
    
    // Mina content
    gsap.from('.mina-content > *', {
      scrollTrigger: {
        trigger: '.mina-content',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      x: 80,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });
  }
  
  animateDashboard() {
    // Dashboard cards
    gsap.from('.dashboard-card', {
      scrollTrigger: {
        trigger: '.controle-dashboard',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      y: 80,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });
  }
}

// Parallax effects
class ParallaxEffects {
  constructor() {
    this.init();
  }
  
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupParallax());
    } else {
      this.setupParallax();
    }
  }
  
  setupParallax() {
    // Gradient orbs parallax
    gsap.to('.orb-1', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: -100,
      ease: 'none'
    });
    
    gsap.to('.orb-2', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: -150,
      ease: 'none'
    });
    
    gsap.to('.orb-3', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: -80,
      ease: 'none'
    });
    
    // Porto image parallax
    gsap.to('.porto-image img', {
      scrollTrigger: {
        trigger: '.porto-image',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      },
      y: -50,
      ease: 'none'
    });
  }
}

// Card hover effects
class CardEffects {
  constructor() {
    this.init();
  }
  
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEffects());
    } else {
      this.setupEffects();
    }
  }
  
  setupEffects() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      });
      
      // 3D tilt effect
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }
}

// Initialize all animations
window.addEventListener('DOMContentLoaded', () => {
  new ScrollAnimations();
  new ParallaxEffects();
  new CardEffects();
});

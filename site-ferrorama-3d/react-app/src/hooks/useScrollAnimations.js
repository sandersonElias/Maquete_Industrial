import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function useScrollAnimations() {
  useEffect(() => {
    // Hero animations
    gsap.from('.title-line', {
      y: 80, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.5,
    });
    gsap.from('.hero-label', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.3 });
    gsap.from('.hero-description', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.8 });
    gsap.from('.stat-item', { y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out', delay: 1 });
    gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 1.3 });

    // Counter animation
    document.querySelectorAll('.stat-value').forEach((stat) => {
      const target = parseInt(stat.dataset.count);
      const obj = { value: 0 };
      gsap.to(obj, {
        value: target, duration: 2, delay: 1.2, ease: 'power2.out',
        onUpdate: () => { stat.textContent = Math.floor(obj.value); },
      });
    });

    // Section headers
    gsap.utils.toArray('.section-header').forEach((header) => {
      gsap.from(header, {
        scrollTrigger: { trigger: header, start: 'top 80%', toggleActions: 'play none none reverse' },
        y: 50, opacity: 0, duration: 1, ease: 'power3.out',
      });
    });

    // Cards
    gsap.utils.toArray('.card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
        y: 80, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out',
      });
    });

    // Code block
    gsap.from('.code-block', {
      scrollTrigger: { trigger: '.code-showcase', start: 'top 70%', toggleActions: 'play none none reverse' },
      x: -100, opacity: 0, duration: 1, ease: 'power3.out',
    });

    // Code features
    gsap.from('.feature-item', {
      scrollTrigger: { trigger: '.code-features', start: 'top 80%', toggleActions: 'play none none reverse' },
      y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    });

    // Porto
    gsap.from('.porto-image', {
      scrollTrigger: { trigger: '.porto-showcase', start: 'top 70%', toggleActions: 'play none none reverse' },
      x: -80, opacity: 0, duration: 1, ease: 'power3.out',
    });
    gsap.from('.porto-item', {
      scrollTrigger: { trigger: '.porto-content', start: 'top 80%', toggleActions: 'play none none reverse' },
      x: 80, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out',
    });

    // Mina
    gsap.from('.mina-3d', {
      scrollTrigger: { trigger: '.mina-showcase', start: 'top 70%', toggleActions: 'play none none reverse' },
      x: -80, opacity: 0, duration: 1, ease: 'power3.out',
    });
    gsap.from('.mina-content > *', {
      scrollTrigger: { trigger: '.mina-content', start: 'top 80%', toggleActions: 'play none none reverse' },
      x: 80, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    });

    // Dashboard cards
    gsap.from('.dashboard-card', {
      scrollTrigger: { trigger: '.controle-dashboard', start: 'top 80%', toggleActions: 'play none none reverse' },
      y: 80, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    });

    // Parallax
    gsap.to('.orb-1', {
      scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
      y: -100, ease: 'none',
    });
    gsap.to('.orb-2', {
      scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
      y: -150, ease: 'none',
    });
    gsap.to('.orb-3', {
      scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 },
      y: -80, ease: 'none',
    });
    gsap.to('.porto-image img', {
      scrollTrigger: { trigger: '.porto-image', start: 'top bottom', end: 'bottom top', scrub: 1 },
      y: -50, ease: 'none',
    });

    // Card 3D hover effects
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      const handleMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((e.clientY - rect.top) - centerY) / 10;
        const rotateY = (centerX - (e.clientX - rect.left)) / 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
      };
      const handleLeave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      };
      card.addEventListener('mousemove', handleMove);
      card.addEventListener('mouseleave', handleLeave);
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);
}

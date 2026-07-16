import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function useScrollAnimations() {
  useEffect(() => {
    // Hero entrance animations (play once on load, no scroll trigger)
    gsap.from('.title-line', {
      y: 80, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.5,
    });
    gsap.from('.hero-label', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.3 });
    gsap.from('.hero-description', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.8 });
    gsap.from('.stat-item', { y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out', delay: 1 });
    gsap.from('.hero-cta', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 1.3 });

    // Counter animation
    document.querySelectorAll('.stat-value').forEach((stat) => {
      const target = parseInt(stat.getAttribute('data-count') || '0');
      const obj = { value: 0 };
      gsap.to(obj, {
        value: target, duration: 2, delay: 1.2, ease: 'power2.out',
        onUpdate: () => { stat.textContent = String(Math.floor(obj.value)); },
      });
    });

    // Parallax effects (subtle movement, no opacity changes)
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
      const handleMove = (e: MouseEvent) => {
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

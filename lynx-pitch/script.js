/**
 * LYNX PARTNERSHIP PROPOSAL
 * Premium One-Page Design with Stunning Animations
 */

// ==========================================
// Loading Screen
// ==========================================
class Loader {
    constructor() {
        this.loader = document.querySelector('.loader');
        this.init();
    }

    init() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loader.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 1500);
        });
    }
}

// ==========================================
// Scroll Progress Bar
// ==========================================
class ScrollProgress {
    constructor() {
        this.progressBar = document.querySelector('.scroll-progress');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            this.progressBar.style.width = `${progress}%`;
        });
    }
}

// ==========================================
// Animated Background Effects
// ==========================================
class AnimatedBackground {
    constructor() {
        this.particlesContainer = document.getElementById('particles');
        this.bgAnimation = document.querySelector('.bg-animation');
        this.init();
    }

    init() {
        this.createParticles();
        this.createMeteors();
        this.createPulseRings();
        this.addMouseParallax();
    }

    createParticles() {
        if (!this.particlesContainer) return;

        const particleCount = window.innerWidth < 768 ? 15 : 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random position
            particle.style.left = `${Math.random() * 100}%`;

            // Random size
            const size = Math.random() * 3 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            // Random animation duration
            const duration = Math.random() * 20 + 15;
            particle.style.animationDuration = `${duration}s`;

            // Random delay
            particle.style.animationDelay = `${Math.random() * duration}s`;

            // Random opacity
            particle.style.opacity = Math.random() * 0.5 + 0.2;

            // Random color tint
            const colors = [
                'rgba(168, 85, 247, 0.6)',
                'rgba(99, 102, 241, 0.6)',
                'rgba(16, 185, 129, 0.5)',
                'rgba(255, 255, 255, 0.4)'
            ];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];

            this.particlesContainer.appendChild(particle);
        }
    }

    createMeteors() {
        if (!this.bgAnimation) return;

        // Create occasional shooting stars
        const createMeteor = () => {
            const meteor = document.createElement('div');
            meteor.className = 'meteor';

            // Random starting position
            meteor.style.left = `${Math.random() * 50}%`;
            meteor.style.top = `${Math.random() * 30}%`;

            // Random length
            const length = Math.random() * 100 + 50;
            meteor.style.width = `${length}px`;

            // Random color
            const colors = [
                'linear-gradient(90deg, rgba(168, 85, 247, 0.8), transparent)',
                'linear-gradient(90deg, rgba(99, 102, 241, 0.8), transparent)',
                'linear-gradient(90deg, rgba(255, 255, 255, 0.6), transparent)'
            ];
            meteor.style.background = colors[Math.floor(Math.random() * colors.length)];

            this.bgAnimation.appendChild(meteor);

            // Remove after animation
            setTimeout(() => {
                meteor.remove();
            }, 3000);
        };

        // Create meteor every 5-15 seconds
        const scheduleMeteor = () => {
            createMeteor();
            setTimeout(scheduleMeteor, Math.random() * 10000 + 5000);
        };

        setTimeout(scheduleMeteor, 3000);
    }

    createPulseRings() {
        if (!this.bgAnimation) return;

        const createRing = () => {
            const ring = document.createElement('div');
            ring.className = 'pulse-ring';

            // Random position
            ring.style.left = `${Math.random() * 80 + 10}%`;
            ring.style.top = `${Math.random() * 80 + 10}%`;
            ring.style.transform = 'translate(-50%, -50%)';

            this.bgAnimation.appendChild(ring);

            // Remove after animation
            setTimeout(() => {
                ring.remove();
            }, 4000);
        };

        // Create ring every 8-15 seconds
        const scheduleRing = () => {
            createRing();
            setTimeout(scheduleRing, Math.random() * 7000 + 8000);
        };

        setTimeout(scheduleRing, 2000);
    }

    addMouseParallax() {
        if (window.innerWidth < 768) return;

        const glows = document.querySelectorAll('.bg-glow');
        const grid = document.querySelector('.bg-grid');

        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        const animate = () => {
            // Smooth interpolation
            currentX += (mouseX - currentX) * 0.05;
            currentY += (mouseY - currentY) * 0.05;

            glows.forEach((glow, index) => {
                const depth = (index + 1) * 15;
                const x = currentX * depth;
                const y = currentY * depth;
                glow.style.transform = `translate(${x}px, ${y}px)`;
            });

            if (grid) {
                grid.style.transform = `translate(${currentX * 5}px, ${currentY * 5}px)`;
            }

            requestAnimationFrame(animate);
        };

        animate();
    }
}

// ==========================================
// Magnetic Button Effect
// ==========================================
class MagneticButtons {
    constructor() {
        this.buttons = document.querySelectorAll('.magnetic, .cta-button, .platform-link, .nav-cta');
        this.init();
    }

    init() {
        this.buttons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0)';
            });
        });
    }
}

// ==========================================
// Parallax Effects
// ==========================================
class ParallaxOrbs {
    constructor() {
        this.orbs = document.querySelectorAll('.orb');
        this.shapes = document.querySelectorAll('.shape');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;

            this.orbs.forEach((orb, index) => {
                const speed = 0.1 + (index * 0.05);
                orb.style.transform = `translateY(${scrollY * speed}px)`;
            });

            this.shapes.forEach((shape, index) => {
                const speed = 0.05 + (index * 0.03);
                shape.style.transform = `translateY(${scrollY * speed}px)`;
            });
        });

        // Mouse parallax
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
            const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;

            this.orbs.forEach((orb, index) => {
                const depth = 20 + (index * 10);
                orb.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
            });
        });
    }
}

// ==========================================
// Scroll Reveal Animations
// ==========================================
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.reveal, .reveal-scale, .reveal-blur, .reveal-left, .reveal-right');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -80px 0px'
        });

        this.elements.forEach(el => observer.observe(el));
    }
}

// ==========================================
// Number Counter Animation
// ==========================================
class NumberCounter {
    constructor() {
        this.counters = document.querySelectorAll('.stat-number[data-count]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateNumber(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        this.counters.forEach(el => observer.observe(el));
    }

    animateNumber(el) {
        const target = parseInt(el.dataset.count);
        const duration = 2500;
        const start = performance.now();

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const update = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutQuart(progress);
            const value = Math.floor(target * ease);

            el.textContent = value.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target.toLocaleString();
            }
        };

        requestAnimationFrame(update);
    }
}

// ==========================================
// Text Scramble Effect (for headlines)
// ==========================================
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];

        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;

        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];

            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="scramble-char">${char}</span>`;
            } else {
                output += from;
            }
        }

        this.el.innerHTML = output;

        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// ==========================================
// 3D Tilt Effect on Cards
// ==========================================
class TiltCards {
    constructor() {
        this.cards = document.querySelectorAll('.feature-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
                card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
                card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }
}

// ==========================================
// Smooth Scroll
// ==========================================
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const offset = 80;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// ==========================================
// Navigation Effects
// ==========================================
class NavEffects {
    constructor() {
        this.nav = document.querySelector('.nav');
        this.init();
    }

    init() {
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;

            if (currentScroll > 100) {
                this.nav.classList.add('scrolled');
            } else {
                this.nav.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });
    }
}

// ==========================================
// Staggered Section Reveals
// ==========================================
class StaggeredReveals {
    constructor() {
        this.sections = document.querySelectorAll('.section');
        this.init();
    }

    init() {
        this.sections.forEach(section => {
            const children = section.querySelectorAll('.reveal, .reveal-scale, .reveal-blur');
            children.forEach((child, index) => {
                child.style.transitionDelay = `${index * 0.1}s`;
            });
        });
    }
}

// ==========================================
// Animated Gradient Background
// ==========================================
class GradientBackground {
    constructor() {
        this.sections = document.querySelectorAll('.section-brilla, .section-trade');
        this.init();
    }

    init() {
        this.sections.forEach(section => {
            section.addEventListener('mousemove', (e) => {
                const rect = section.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                section.style.background = `
                    radial-gradient(circle at ${x}% ${y}%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
                    ${section.classList.contains('section-brilla')
                        ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.02) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(99, 102, 241, 0.02) 100%)'
                        : 'linear-gradient(180deg, rgba(16, 185, 129, 0.02) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(16, 185, 129, 0.02) 100%)'}
                `;
            });
        });
    }
}

// ==========================================
// Split Text Animation for Hero
// ==========================================
class SplitText {
    constructor() {
        this.init();
    }

    init() {
        // Already handled in CSS with .line and .line-inner
        // This adds the wrapper dynamically
        const lines = document.querySelectorAll('.hero-title .line');
        lines.forEach(line => {
            if (!line.querySelector('.line-inner')) {
                const text = line.innerHTML;
                line.innerHTML = `<span class="line-inner">${text}</span>`;
            }
        });
    }
}

// ==========================================
// Intersection Animation for Timeline
// ==========================================
class TimelineAnimation {
    constructor() {
        this.steps = document.querySelectorAll('.timeline-step');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                        entry.target.querySelector('.step-number').style.animation = 'glowPulse 2s ease-in-out infinite';
                    }, index * 200);
                }
            });
        }, { threshold: 0.5 });

        this.steps.forEach(step => {
            step.classList.add('reveal');
            observer.observe(step);
        });
    }
}

// ==========================================
// Floating Elements Physics
// ==========================================
class FloatingElements {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        // Create floating shapes
        const shapesContainer = document.createElement('div');
        shapesContainer.className = 'floating-shapes';

        for (let i = 0; i < 3; i++) {
            const shape = document.createElement('div');
            shape.className = `shape shape-${i + 1}`;
            shapesContainer.appendChild(shape);
        }

        hero.appendChild(shapesContainer);
    }
}

// ==========================================
// Initialize Everything
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize loader
    new Loader();

    // Initialize scroll progress
    new ScrollProgress();

    // Initialize animated background
    new AnimatedBackground();

    // Desktop-only effects
    if (window.innerWidth > 768) {
        new MagneticButtons();
        new TiltCards();
    }

    // Core animations
    new ParallaxOrbs();
    new ScrollReveal();
    new NumberCounter();
    new SmoothScroll();
    new NavEffects();
    new StaggeredReveals();
    new GradientBackground();
    new SplitText();
    new TimelineAnimation();
    new FloatingElements();

    // Console branding
    console.log('%c✦ Partnership Proposal', 'font-size: 24px; font-weight: 700; color: #a855f7; text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);');
    console.log('%cLynx Group × Tech Creative', 'font-size: 14px; color: #71717a;');
    console.log('%c🚀 Powered by stunning animations', 'font-size: 12px; color: #6366f1;');
});

// Preload critical resources
window.addEventListener('load', () => {
    // Trigger any entrance animations
    document.body.classList.add('loaded');
});

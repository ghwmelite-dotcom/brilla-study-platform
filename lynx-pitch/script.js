/**
 * LYNX ACN PARTNERSHIP PROPOSAL
 * Interactive Web Presentation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initNavigation();
    initScrollAnimations();
    initCounterAnimations();
    initSmoothScroll();
    initParallaxEffects();
    initChartAnimations();
});

/**
 * Navigation Module
 */
function initNavigation() {
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    let lastScrollY = window.scrollY;

    // Scroll behavior for nav
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Add scrolled class
        if (currentScrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Hide/show nav on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    });

    // Mobile menu toggle
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close mobile menu on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

/**
 * Scroll Animations Module
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Stagger children if they exist
                const children = entry.target.querySelectorAll('.stagger-child');
                children.forEach((child, index) => {
                    child.style.transitionDelay = `${index * 0.1}s`;
                    child.classList.add('visible');
                });
            }
        });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Counter Animations Module
 */
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    const observerOptions = {
        threshold: 0.5
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const countTo = parseInt(target.getAttribute('data-count'));
                animateCounter(target, countTo);
                counterObserver.unobserve(target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, target) {
    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out-expo)
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (target - startValue) * easeProgress);

        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString();
            // Add + suffix for some counters
            if (target === 200) {
                element.textContent += '+';
            }
        }
    }

    requestAnimationFrame(updateCounter);
}

/**
 * Smooth Scroll Module
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = document.getElementById('nav').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Parallax Effects Module
 */
function initParallaxEffects() {
    const orbs = document.querySelectorAll('.gradient-orb, .cta-orb');

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                orbs.forEach((orb, index) => {
                    const speed = 0.05 + (index * 0.02);
                    const yPos = scrollY * speed;
                    orb.style.transform = `translateY(${yPos}px)`;
                });

                ticking = false;
            });

            ticking = true;
        }
    });
}

/**
 * Chart Animations Module
 */
function initChartAnimations() {
    const chartBars = document.querySelectorAll('.chart-bar');

    const observerOptions = {
        threshold: 0.5
    };

    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.chart-bar');
                bars.forEach((bar, index) => {
                    setTimeout(() => {
                        bar.style.transform = 'scaleY(1)';
                        bar.style.opacity = '1';
                    }, index * 100);
                });
                chartObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const chartPreview = document.querySelector('.chart-preview');
    if (chartPreview) {
        // Set initial state
        chartBars.forEach(bar => {
            bar.style.transform = 'scaleY(0)';
            bar.style.transformOrigin = 'bottom';
            bar.style.opacity = '0';
            bar.style.transition = 'all 0.5s ease-out';
        });

        chartObserver.observe(chartPreview);
    }
}

/**
 * Typewriter Effect (Optional Enhancement)
 */
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

/**
 * Cursor Glow Effect (Optional Enhancement)
 */
function initCursorGlow() {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateGlow() {
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;

        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';

        requestAnimationFrame(animateGlow);
    }

    animateGlow();
}

/**
 * Loading Animation
 */
function initLoadingAnimation() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <p>Loading Presentation...</p>
        </div>
    `;
    document.body.appendChild(loader);

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('loaded');
            setTimeout(() => {
                loader.remove();
            }, 500);
        }, 500);
    });
}

/**
 * Keyboard Navigation
 */
document.addEventListener('keydown', (e) => {
    const sections = ['hero', 'vision', 'platforms', 'benefits', 'contact'];
    let currentSection = 0;

    // Find current section
    sections.forEach((section, index) => {
        const el = document.getElementById(section);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom > 100) {
                currentSection = index;
            }
        }
    });

    // Arrow down or space
    if (e.key === 'ArrowDown' || (e.key === ' ' && !e.target.matches('input, textarea'))) {
        e.preventDefault();
        if (currentSection < sections.length - 1) {
            const nextSection = document.getElementById(sections[currentSection + 1]);
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    // Arrow up
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentSection > 0) {
            const prevSection = document.getElementById(sections[currentSection - 1]);
            if (prevSection) {
                prevSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
});

/**
 * Add dynamic year to footer
 */
document.addEventListener('DOMContentLoaded', () => {
    const footerYear = document.querySelector('.footer-copyright');
    if (footerYear) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        footerYear.textContent = `Partnership Proposal for Lynx Group & ACN | ${currentMonth} ${currentYear}`;
    }
});

/**
 * Performance optimization: Lazy load images
 */
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

/**
 * Console Easter Egg
 */
console.log('%c🚀 Partnership Proposal', 'font-size: 24px; font-weight: bold; color: #8B5CF6;');
console.log('%cBuilding Systems That Outlive Us', 'font-size: 14px; color: #A78BFA;');
console.log('%cBrillaPrep.org | TradeMetricsPro.com', 'font-size: 12px; color: #71717A;');

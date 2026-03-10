// RSVP: Vérification email avant affichage du formulaire
// ==========================================
// COUNTDOWN TIMER
// ==========================================
function updateCountdown() {
    // Date du mariage : 9 août 2026 à 15h00
    const weddingDate = new Date('2026-08-09T15:00:00').getTime();
    function update() {
        const now = new Date().getTime();
        const distance = weddingDate - now;
        // Calculs
        const days = Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24)));
        const hours = Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        const minutes = Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));

        // Mise à jour du DOM
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        if (daysEl) daysEl.textContent = String(days).padStart(3, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');

        // Si le compte à rebours est terminé
        if (distance < 0) {
            clearInterval(countdownInterval);
            const countdownDiv = document.getElementById('countdown');
            if (countdownDiv) {
                countdownDiv.innerHTML = `<div style="font-size: 2rem; color: var(--terracotta);">🎉 C'est aujourd'hui ! 🎉</div>`;
            }
        }

    }

    update();
    // Mise à jour toutes les minutes
    window.countdownInterval = setInterval(update, 60000);
}

// Lance le compteur dès que la page est chargée
document.addEventListener('DOMContentLoaded', updateCountdown);

// RSVP: form served by Google Apps Script HtmlService in an iframe
document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('rsvpIframe');
    const loading = document.getElementById('rsvpIframeLoading');
    if (!iframe) return;

    iframe.addEventListener('load', () => {
        if (loading) loading.style.display = 'none';
        iframe.classList.add('is-loaded');
    });
});

// ==========================================
// SMOOTH SCROLL & ACTIVE NAV
// ==========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navHeight = document.querySelector('nav').offsetHeight;
            const targetPosition = targetElement.offsetTop - navHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

// ==========================================
// ACTIVE NAV ON SCROLL
// ==========================================

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    const navHeight = document.querySelector('nav').offsetHeight;
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - navHeight - 100;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });

    // Toggle cream gradient background on nav when reaching RSVP (and beyond)
    const navEl = document.querySelector('nav');
    const rsvpSection = document.getElementById('rsvp');
    if (navEl && rsvpSection) {
        if (window.scrollY >= (rsvpSection.offsetTop - navHeight - 1)) {
            navEl.classList.add('nav-cream');
        } else {
            navEl.classList.remove('nav-cream');
        }
    }
});

// Ensure correct initial nav background on load (in case page opens mid-way)
document.addEventListener('DOMContentLoaded', () => {
    const navEl = document.querySelector('nav');
    const rsvpSection = document.getElementById('rsvp');
    if (navEl && rsvpSection) {
        const navHeight = navEl.offsetHeight;
        if (window.scrollY >= (rsvpSection.offsetTop - navHeight - 1)) {
            navEl.classList.add('nav-cream');
        } else {
            navEl.classList.remove('nav-cream');
        }
    }
});

// ==========================================
// MOBILE BURGER MENU
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('mainNav');
    const burger = document.getElementById('navBurger');
    const mobileNav = document.getElementById('mobileNav');
    if (!nav || !burger || !mobileNav) return;

    function isOpen() {
        return nav.classList.contains('is-mobile-open');
    }

    function open() {
        nav.classList.add('is-mobile-open');
        burger.setAttribute('aria-expanded', 'true');
        mobileNav.setAttribute('aria-hidden', 'false');
    }

    function close() {
        nav.classList.remove('is-mobile-open');
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
    }

    burger.addEventListener('click', (e) => {
        e.preventDefault();
        if (isOpen()) close(); else open();
    });

    // Close when clicking a link
    mobileNav.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', () => close());
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!isOpen()) return;
        if (nav.contains(e.target)) return;
        close();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) close();
    });

    // Defensive: close when going back to desktop width
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && isOpen()) close();
    });
});

// ==========================================
// CONTRIBUTION MODAL (125€/personne)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const link = document.getElementById('contributionLink');
    const modal = document.getElementById('contributionModal');
    const closeBtn = document.getElementById('contributionClose');
    const dialog = modal ? modal.querySelector('.modal-dialog') : null;
    if (!link || !modal || !closeBtn) return;

    let lastActiveElement = null;

    function openModal(e) {
        if (e) e.preventDefault();
        lastActiveElement = document.activeElement;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closeModal() {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
            lastActiveElement.focus();
        }
    }

    // Force a safe initial state (in case HTML was edited and the modal is visible)
    closeModal();

    link.addEventListener('click', openModal);
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });

    // Prevent clicks inside dialog from closing the modal
    if (dialog) {
        dialog.addEventListener('click', (e) => e.stopPropagation());
    }

    // Click outside dialog closes (robust even if target isn't exactly the overlay)
    modal.addEventListener('click', (e) => {
        if (!dialog) {
            closeModal();
            return;
        }
        // If click is outside dialog, close
        if (!dialog.contains(e.target)) closeModal();
    });

    // Prevent placeholder links in the modal from jumping to top (#)
    modal.querySelectorAll('a[href="#"]').forEach((a) => {
        a.addEventListener('click', (e) => e.preventDefault());
    });

    // Copy helper (for Lydia/Wero phone, etc.)
    modal.querySelectorAll('[data-copy]').forEach((el) => {
        el.addEventListener('click', async () => {
            const value = el.getAttribute('data-copy') || '';
            try {
                await navigator.clipboard.writeText(value);
                el.textContent = 'Copié !';
                setTimeout(() => { el.textContent = '06 60 40 67 03'; }, 1200);
            } catch {
                // Clipboard may fail depending on browser context
            }
        });
    });

    // ESC closes
    function onKeyDown(e) {
        if (!modal.hidden && e.key === 'Escape') closeModal();
    }
    document.addEventListener('keydown', onKeyDown);
});

// ==========================================
// SCROLL ANIMATIONS (Fade in on scroll)
// ==========================================

const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Éléments à animer au scroll
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
        '.logement-card, .rsvp-card, .cagnotte-card, .schedule-item, .schedule-photo'
    );
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// ==========================================
// PARALLAX EFFECT (léger effet sur les patterns)
// ==========================================

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const patterns = document.querySelectorAll('.hero-pattern');
    patterns.forEach((pattern, index) => {
        const speed = (index + 1) * 0.3;
        pattern.style.transform = `translateY(${scrolled * speed}px) rotate(${index === 0 ? '-15deg' : '15deg'})`;
    });
});

// ==========================================
// EASTER EGG : Double-clic sur les noms
// ==========================================

let clickCount = 0;
const namesElement = document.querySelector('.names');

if (namesElement) {
    namesElement.addEventListener('click', () => {
        clickCount++;
        if (clickCount === 2) {
            createHearts();
            clickCount = 0;
        }
        setTimeout(() => { clickCount = 0; }, 1000);
    });
}

function createHearts() {
    const hearts = ['❤️', '💕', '💖', '💗', '💓', '💞'];
    for (let i = 0; i < 20; i++) {
        const heart = document.createElement('div');
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.position = 'fixed';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.top = '-50px';
        heart.style.fontSize = (Math.random() * 2 + 1) + 'rem';
        heart.style.zIndex = '9999';
        heart.style.pointerEvents = 'none';
        heart.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        document.body.appendChild(heart);
        setTimeout(() => { heart.remove(); }, 5000);
    }
}

// Animation CSS pour les coeurs (ajoutée dynamiquement)
const style = document.createElement('style');
style.textContent = `
        @keyframes fall {
                to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
`;
document.head.appendChild(style);

// ==========================================
// SIMPLE CAROUSEL (Cagnotte image frame)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.getElementById('giftCarousel');
    if (!carousel) return;
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    let index = 0;
    let autoTimer;

    // Build dots
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Aller à l'image ${i + 1}`);
        if (i === 0) dot.setAttribute('aria-current', 'true');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
    });

    function update() {
        const slideWidth = slides[0] ? slides[0].getBoundingClientRect().width : carousel.clientWidth;
        const offsetPx = -index * slideWidth;
        track.style.transform = `translateX(${offsetPx}px)`;
        slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
        dotsContainer.querySelectorAll('button').forEach((b, i) => {
            if (i === index) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
        });
    }

    function goTo(i) { index = (i + slides.length) % slides.length; update(); restartAuto(); }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startAuto() { autoTimer = setInterval(next, 4500); }
    function stopAuto() { clearInterval(autoTimer); }
    function restartAuto() { stopAuto(); startAuto(); }

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    window.addEventListener('resize', update);
    requestAnimationFrame(update);
    startAuto();
});



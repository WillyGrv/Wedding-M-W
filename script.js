// Parallax léger sur les patterns décoratifs
window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    document.querySelectorAll('.hero-pattern-left').forEach(el => {
        el.style.transform = `rotate(-15deg) translateY(${scrollY * 0.08}px)`;
    });
    document.querySelectorAll('.hero-pattern-right').forEach(el => {
        el.style.transform = `rotate(15deg) translateY(-${scrollY * 0.08}px)`;
    });
});
// Apparition animée des sections au scroll
function revealSectionsOnScroll() {
    const sections = document.querySelectorAll('section');
    const trigger = window.innerHeight * 0.85;
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if(rect.top < trigger) {
            section.classList.add('visible');
        }
    });
}
window.addEventListener('scroll', revealSectionsOnScroll);
window.addEventListener('resize', revealSectionsOnScroll);
document.addEventListener('DOMContentLoaded', revealSectionsOnScroll);
// Ajoute une classe .scrolled au body quand la section RSVP entre dans la fenêtre
const rsvpSection = document.getElementById('rsvp');
function checkRSVPScroll() {
    const rect = rsvpSection.getBoundingClientRect();
    if(rect.top <= 60) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
}
window.addEventListener('scroll', checkRSVPScroll);
window.addEventListener('resize', checkRSVPScroll);
document.addEventListener('DOMContentLoaded', checkRSVPScroll);
// ==========================================
// INTRO ANIMATION
// ==========================================

window.addEventListener('load', () => {
    const introOverlay = document.getElementById('introOverlay');
    
    // Cache l'intro après 3.5 secondes
    setTimeout(() => {
        introOverlay.style.display = 'none';
    }, 3500);
});

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
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        // Mise à jour du DOM
        document.getElementById('days').textContent = String(days).padStart(3, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        
        // Si le compte à rebours est terminé
        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown').innerHTML = `
                <div style="font-size: 2rem; color: var(--terracotta);">
                    🎉 C'est aujourd'hui ! 🎉
                </div>
            `;
        }
    }
    
    // Mise à jour immédiate
    update();
    
    // Mise à jour toutes les minutes
    const countdownInterval = setInterval(update, 60000);
}

// Lance le compteur dès que la page est chargée
updateCountdown();

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
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
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
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ==========================================
// SCROLL ANIMATIONS (Fade in on scroll)
// ==========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

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
        '.logement-card, .photo-item, .rsvp-card, .cagnotte-card, .map-container'
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
            // Crée des confettis ou un message spécial
            createHearts();
            clickCount = 0;
        }
        
        // Reset après 1 seconde
        setTimeout(() => {
            clickCount = 0;
        }, 1000);
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
        
        setTimeout(() => {
            heart.remove();
        }, 5000);
    }
}

// Animation CSS pour les coeurs (ajoutée dynamiquement)
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// LAZY LOADING IMAGES (amélioration performance)
// ==========================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });
    
    // Si vous voulez activer le lazy loading, ajoutez data-src dans le HTML
    // et remplacez src par une image placeholder
}

// ==========================================
// CONSOLE MESSAGE (pour les curieux)
// ==========================================

console.log('%c💒 Maureen & William 💒', 'font-size: 24px; color: #C97B63; font-weight: bold;');
console.log('%c9-11 Août 2026 • Montélimar', 'font-size: 14px; color: #7A8268;');
console.log('%cThème Méditerranéen 🌿🍊', 'font-size: 12px; color: #D4915D;');
console.log('%cSite créé avec amour ❤️', 'font-size: 12px; color: #7B3F3F; font-style: italic;');

// ==========================================
// EMBED RSVP FORM (insère un iframe dans la carte de droite)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openRsvpBtn');
    const rsvpCard = openBtn ? openBtn.closest('.rsvp-card') : null;

    if (!openBtn || !rsvpCard) return;

    // We'll save the original innerHTML to be able to restore it on close.
    let originalInnerHTML = null;
    let originalWidthStyle = '';

    function createIframeWrapper(src) {
        const wrapper = document.createElement('div');
        wrapper.className = 'rsvp-iframe-wrapper';

        const toolbar = document.createElement('div');
        toolbar.className = 'rsvp-iframe-toolbar';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'rsvp-iframe-close';
        closeBtn.setAttribute('aria-label', 'Fermer le formulaire RSVP');
        closeBtn.textContent = 'Fermer';
        toolbar.appendChild(closeBtn);
        wrapper.appendChild(toolbar);

        const iframe = document.createElement('iframe');
        const trySrc = src.includes('docs.google.com') ? (src + (src.includes('?') ? '&' : '?') + 'embedded=true') : src;
        iframe.src = trySrc;
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        wrapper.appendChild(iframe);

        const fallback = document.createElement('div');
        fallback.className = 'rsvp-iframe-fallback';
        fallback.innerHTML = `Si le formulaire ne s'affiche pas, <a href="${src}" target="_blank" rel="noopener">ouvrez-le dans un nouvel onglet</a>.`;
        wrapper.appendChild(fallback);

        // Close handler: restore original HTML and rebind the open button
        closeBtn.addEventListener('click', () => {
            rsvpCard.classList.remove('rsvp-embedded');
            if (originalInnerHTML !== null) {
                rsvpCard.innerHTML = originalInnerHTML;
                // re-initialize the RSVP button listener on restored content
                // small timeout ensures DOM is updated
                setTimeout(() => {
                    setupRsvpEmbed();
                }, 20);
            }
        });

        return wrapper;
    }

    function setupRsvpEmbed() {
        const btn = document.getElementById('openRsvpBtn');
        if (!btn) return;

        btn.addEventListener('click', function handleOpen(e) {
            e.preventDefault();
            const src = btn.dataset.formSrc || btn.getAttribute('href');
            if (!src) return window.open(btn.href, '_blank');

            // Save original markup once
            if (originalInnerHTML === null) originalInnerHTML = rsvpCard.innerHTML;

            // Freeze card width to prevent grid reflow (keeps right column width stable)
            originalWidthStyle = rsvpCard.style.width || '';
            const rect = rsvpCard.getBoundingClientRect();
            rsvpCard.style.width = rect.width + 'px';

            // Clear and insert iframe wrapper directly in the card (ensures nothing else remains visible)
            rsvpCard.innerHTML = '';
            rsvpCard.classList.add('rsvp-embedded');
            const wrapper = createIframeWrapper(src);
            rsvpCard.appendChild(wrapper);

            // Ensure width is restored when close button is clicked inside the wrapper
            const closeBtn = wrapper.querySelector('.rsvp-iframe-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    rsvpCard.style.width = originalWidthStyle;
                });
            }
        }, { once: true });
    }

    // Init
    setupRsvpEmbed();
});

// ==========================================
// BACK TO TOP BUTTON (desktop-only, visible when RSVP in view)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backToTop');
    const sectionsToWatch = Array.from(document.querySelectorAll('#rsvp, #logements, #cagnotte'));

    if (!backBtn || sectionsToWatch.length === 0) return;

    // Show the button when ANY of the watched sections (from RSVP down) is visible, on desktop
    const obs = new IntersectionObserver((entries) => {
        const isDesktop = window.innerWidth >= 1024;
        let anyVisible = false;
        entries.forEach(entry => {
            if (entry.isIntersecting) anyVisible = true;
        });

        if (isDesktop && anyVisible) {
            backBtn.classList.add('visible');
            backBtn.setAttribute('aria-hidden', 'false');
        } else {
            backBtn.classList.remove('visible');
            backBtn.setAttribute('aria-hidden', 'true');
        }
    }, { threshold: 0.15 });

    sectionsToWatch.forEach(s => obs.observe(s));

    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Hide/show on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth < 1024) {
            backBtn.classList.remove('visible');
            backBtn.setAttribute('aria-hidden', 'true');
        }
    });
});

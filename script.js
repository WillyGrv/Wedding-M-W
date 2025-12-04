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
document.addEventListener('DOMContentLoaded', () => {
    const rsvpCard = document.querySelector('.rsvp-card');
    if (!rsvpCard) return;
    const originalHTML = rsvpCard.innerHTML;
    const formIframe = `
        <div style="width:100%;display:flex;justify-content: flex-end;margin-bottom: 2%;">
            <button id="rsvpRetourBtn" style="padding:8px 16px;border-radius:8px;border:none;background:#eee;font-weight:500;cursor:pointer;">Retour</button>
        </div>
        <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSewEkWOQkJiKJOBlMmxI647K0kBp3i6Ne_8pGFKxmO7LrYFjQ/viewform?embedded=true" width="100%" height="100%" frameborder="0" marginheight="0" marginwidth="0" style="display:block; border-radius:16px; background:#fff;">Chargement…</iframe>
    `;
    const apiUrl = 'https://script.google.com/macros/s/AKfycbzmmcFRWjK0Tqs1DeOEti4SQtio3x6nOI2K8mve6lyouugVVMQORWsAyZKBnn_RhY4udg/exec';

    function restoreRsvpCard(e) {
        if (e) e.preventDefault();
        rsvpCard.innerHTML = originalHTML;
        rsvpCard.style.width = '';
        rsvpCard.style.height = '';
        rsvpCard.style.maxWidth = '';
        rsvpCard.style.maxHeight = '';
        attachRsvpCheck();
    }

    function attachRsvpCheck() {
        const checkBtn = document.getElementById('rsvpCheckBtn');
        const emailInput = document.getElementById('rsvpEmail');
        const resultDiv = document.getElementById('rsvpCheckResult');
        if (checkBtn) {
            checkBtn.addEventListener('click', async () => {
                const email = emailInput.value.trim();
                if (!email) {
                    resultDiv.textContent = '';
                    return;
                }
                // Vérification structure email classique
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    resultDiv.textContent = 'Veuillez entrer une adresse email valide.';
                    return;
                }
                resultDiv.textContent = 'Vérification en cours...';
                try {
                    const res = await fetch(`${apiUrl}?email=${encodeURIComponent(email)}`);
                    const data = await res.json();
                    if (data.found) {
                        rsvpCard.innerHTML = `<div class="rsvp-success" style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;text-align:center;font-size:1.25rem;color:var(--burgundy);font-weight:600;position:relative;">
                            <span>Inscription déjà validée pour <strong>${data.prenom} ${data.nom}</strong> !</span>
                            <div id="fireworks"></div>
                        </div>`;
                        launchFireworks();
// Animation feu d'artifice puissante et colorée
function launchFireworks() {
    const container = document.getElementById('fireworks');
    if (!container) return;
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    for (let burst = 0; burst < 7; burst++) {
        setTimeout(() => {
            const n = Math.floor(Math.random()*18)+22;
            const centerX = 50 + (Math.random()-0.5)*30;
            const centerY = 50 + (Math.random()-0.5)*30;
            for (let i = 0; i < n; i++) {
                const particle = document.createElement('div');
                const colors = ['#C97B63', '#D4A5A5', '#D4915D', '#7B3F3F', '#7A8268', '#F5EFE7', '#E8D5C4', '#4A7C7E', '#FFD700', '#FF69B4', '#00BFFF'];
                particle.style.position = 'absolute';
                particle.style.width = Math.random()*12+10+'px';
                particle.style.height = particle.style.width;
                particle.style.borderRadius = '50%';
                particle.style.background = colors[Math.floor(Math.random()*colors.length)];
                particle.style.left = centerX+'%';
                particle.style.top = centerY+'%';
                particle.style.opacity = '0.88';
                particle.style.zIndex = '9999';
                particle.style.boxShadow = `0 0 ${Math.random()*32+12}px ${colors[Math.floor(Math.random()*colors.length)]}`;
                const angle = (360/n)*i + Math.random()*20;
                const distance = Math.random()*140+100;
                const x = Math.cos(angle*Math.PI/180)*distance;
                const y = Math.sin(angle*Math.PI/180)*distance;
                const scale = Math.random()*1.5+0.7;
                const rotate = Math.random()*360;
                particle.animate([
                    { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
                    { transform: `translate(${x}px,${y}px) scale(${scale}) rotate(${rotate}deg)`, opacity: 0.1 }
                ], {
                    duration: 1200 + Math.random()*900,
                    easing: 'cubic-bezier(.23,1.01,.32,1)',
                    fill: 'forwards'
                });
                container.appendChild(particle);
                setTimeout(() => particle.remove(), 1800);
            }
            // Effet halo/flash
            if (Math.random()>0.5) {
                const halo = document.createElement('div');
                halo.style.position = 'absolute';
                halo.style.left = centerX+'%';
                halo.style.top = centerY+'%';
                halo.style.width = '0px';
                halo.style.height = '0px';
                halo.style.borderRadius = '50%';
                halo.style.background = colors[Math.floor(Math.random()*colors.length)];
                halo.style.opacity = '0.18';
                halo.style.zIndex = '9998';
                halo.animate([
                    { width: '0px', height: '0px', opacity: 0.18 },
                    { width: '160px', height: '160px', opacity: 0 }
                ], {
                    duration: 900,
                    easing: 'ease-out',
                    fill: 'forwards'
                });
                container.appendChild(halo);
                setTimeout(() => halo.remove(), 950);
            }
        }, burst*350);
    }
}
                    } else {
                        resultDiv.innerHTML = `Ton email n'a pas été trouvé.<br><button id="showRsvpFormBtn">Accéder au formulaire</button>`;
                        const showFormBtn = document.getElementById('showRsvpFormBtn');
                        if (showFormBtn) {
                            showFormBtn.addEventListener('click', () => {
                                rsvpCard.innerHTML = formIframe;
                                const retourBtn = rsvpCard.querySelector('#rsvpRetourBtn');
                                if (retourBtn) {
                                    retourBtn.addEventListener('click', restoreRsvpCard);
                                }
                            });
                        }
                    }
                } catch (err) {
                    resultDiv.textContent = 'Erreur de vérification, réessayez plus tard.';
                }
            });
        }
    }
    attachRsvpCheck();
});
                // === Ajout du bloc RSVP Check ===
                const formIframe = `
                        <div style="width:100%;display:flex;justify-content: flex-end;margin-bottom: 2%;">
                            <button id="rsvpRetourBtn" style="padding:8px 16px;border-radius:8px;border:none;background:#eee;font-weight:500;cursor:pointer;">Retour</button>
                        </div>
                        <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSewEkWOQkJiKJOBlMmxI647K0kBp3i6Ne_8pGFKxmO7LrYFjQ/viewform?embedded=true" width="100%" height="100%" frameborder="0" marginheight="0" marginwidth="0" style="display:block; border-radius:16px; background:#fff;">Chargement…</iframe>
                    `;
                const apiUrl = 'https://script.google.com/macros/s/AKfycbzmmcFRWjK0Tqs1DeOEti4SQtio3x6nOI2K8mve6lyouugVVMQORWsAyZKBnn_RhY4udg/exec'; // remplace par ton URL

                function attachRsvpCheck() {
                    const checkBtn = document.getElementById('rsvpCheckBtn');
                    const emailInput = document.getElementById('rsvpEmail');
                    const resultDiv = document.getElementById('rsvpCheckResult');
                    if (checkBtn) {
                        checkBtn.addEventListener('click', async () => {
                            const email = emailInput.value.trim();
                            if (!email) {
                                resultDiv.textContent = 'Veuillez entrer un email.';
                                return;
                            }
                            resultDiv.textContent = 'Vérification en cours...';
                            try {
                                const res = await fetch(`${apiUrl}?email=${encodeURIComponent(email)}`);
                                const data = await res.json();
                                if (data.found) {
                                    if (rsvpCard) {
                                        rsvpCard.innerHTML = `<div class=\"rsvp-success\">Inscription déjà validée pour <strong>${data.prenom} ${data.nom}</strong> !</div>`;
                                    }
                                } else {
                                    if (rsvpCard) {
                                        rsvpCard.innerHTML = formIframe;
                                        // Réattache le handler du bouton retour
                                        const retourBtn = rsvpCard.querySelector('#rsvpRetourBtn');
                                        if (retourBtn) {
                                            retourBtn.addEventListener('click', (e) => {
                                                e.preventDefault();
                                                location.reload(); // recharge la page pour revenir au check
                                            });
                                        }
                                    }
                                }
                            } catch (err) {
                               
                            }
                        });
                    }
                }
                attachRsvpCheck();
        ;
    update();
     
    // Mise à jour toutes les minutes
    const countdownInterval = setInterval(update, 60000);


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



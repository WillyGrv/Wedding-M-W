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

// ==========================================
// RSVP (Solution 1): formulaire côté site + POST vers GAS (no CORS)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('rsvp-app');
    if (!mount) return;

    // IMPORTANT: submit stays on GAS (no CORS) via <form target="rsvpSubmitFrame">.
    // Needs a doPost(e) in GAS that routes to handleRsvpSubmit_.
    const GAS_EXEC_URL = 'https://script.google.com/macros/s/AKfycbx2yNpUdEVuUjQvYxED20KLtaGrnEeyCuaRVJwHdM-e5MYQNrSEels-OOnYROglPXb4TQ/exec';
    const SUBMIT_URL = `${GAS_EXEC_URL}?route=${encodeURIComponent('/api/rsvp/submit')}`;

    // Email check: legacy flow (simple JSON) — call exec directly with ?email=...
    // Expected JSON: { found: boolean, prenom?: string, nom?: string }
    const RSVP_CHECK_API_URL = 'https://script.google.com/macros/s/AKfycbx2yNpUdEVuUjQvYxED20KLtaGrnEeyCuaRVJwHdM-e5MYQNrSEels-OOnYROglPXb4TQ/exec';

    function isValidEmail(email) {
        const s = String(email || '').trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }

    async function checkEmailLegacy(email) {
        // Attempt 1 (legacy): .../exec?email=...
        // If the deployed script is now route-based, it may answer { ok:true, route:null }.
        // In that case we fallback to the explicit check route.
        const url1 = new URL(RSVP_CHECK_API_URL);
        url1.searchParams.set('email', email);
        url1.searchParams.set('_ts', String(Date.now()));

        const res1 = await fetch(url1.toString(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        });
        const data1 = await res1.json();
        if (data1 && typeof data1.found === 'boolean') return data1;

        // Fallback (route-based GAS): .../exec?route=/api/rsvp/checkF&email=...
        const url2 = new URL(RSVP_CHECK_API_URL);
        url2.searchParams.set('route', '/api/rsvp/checkF');
        url2.searchParams.set('email', email);
        url2.searchParams.set('_ts', String(Date.now()));
        const res2 = await fetch(url2.toString(), {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        });
        const data2 = await res2.json();
        return data2;
    }

    const formHtml = `
        <form id="rsvpForm" class="rsvp-form" novalidate>
            <div class="rsvp-step" data-step="presence">
                <p class="rsvp-title">Est-ce que je serai présent pour ce mariage du siècle ?</p>
                <label class="rsvp-radio"><input type="radio" name="presence" value="Oui, je serai là" required> Oui, je serai là</label>
                <label class="rsvp-radio"><input type="radio" name="presence" value="Désolé, je ne pourrai pas venir :(" required> Désolé, je ne pourrai pas venir :(</label>
            </div>

            <div class="rsvp-step" data-step="no" hidden>
                <p class="rsvp-title">Oh noooon 😞</p>
                <label class="rsvp-label">Indique-nous ton nom complet que l'on puisse bien confirmer l'info</label>
                <input class="rsvp-input" type="text" name="nomComplet" autocomplete="name" required>
            </div>

            <div class="rsvp-step" data-step="yes" hidden>
                <p class="rsvp-title">Youuy ! Trop hâte de te voir ramper !</p>

                <label class="rsvp-label">Indique ton nom de famille</label>
                <input class="rsvp-input" type="text" name="nom" autocomplete="family-name" required>

                <label class="rsvp-label">Indique ton prénom</label>
                <input class="rsvp-input" type="text" name="prenom" autocomplete="given-name" required>

                <label class="rsvp-label">Indique ton adresse email</label>
                <input class="rsvp-input" type="email" name="email" autocomplete="email" required>

                <label class="rsvp-label">Indique ton numéro de téléphone</label>
                <input class="rsvp-input" type="tel" name="telephone" autocomplete="tel" required>

                <label class="rsvp-label">Indique ton code postal</label>
                <input class="rsvp-input" type="text" name="codePostal" autocomplete="postal-code" required>

                <label class="rsvp-label">Indique ta ville</label>
                <input class="rsvp-input" type="text" name="ville" autocomplete="address-level2" required>

                <label class="rsvp-label">Indique ton adresse (ligne 1)</label>
                <input class="rsvp-input" type="text" name="adresse1" autocomplete="address-line1" required>
            </div>

            <div class="rsvp-step" data-step="more" hidden>
                <p class="rsvp-title">Quelques informations sur toi...</p>

                <label class="rsvp-label">Régime alimentaire particulier</label>
                <div class="rsvp-checks">
                    <label><input type="checkbox" name="regime" value="Aucun, je mange de tout"> Aucun, je mange de tout</label>
                    <label><input type="checkbox" name="regime" value="Sans gluten"> Sans gluten</label>
                    <label><input type="checkbox" name="regime" value="Sans porc"> Sans porc</label>
                    <label><input type="checkbox" name="regime" value="Sans viande (pescétarien)"> Sans viande (pescétarien)</label>
                    <label><input type="checkbox" name="regime" value="Végétarien"> Végétarien</label>
                    <label><input type="checkbox" name="regime" value="Végétalien (produit d'origine animale)"> Végétalien (produit d'origine animale)</label>
                </div>

                <label class="rsvp-label" style="margin-top:0.75rem;">Préférences alcoolisées</label>
                <label class="rsvp-radio"><input type="radio" name="alcool" value="Avec modération de tout" required> Avec modération de tout</label>
                <label class="rsvp-radio"><input type="radio" name="alcool" value="Je ne bois pas d'alcool du tout" required> Je ne bois pas d'alcool du tout</label>

                <label class="rsvp-label" style="margin-top:0.75rem;">As-tu une allergie alimentaire quelconque ?</label>
                <input class="rsvp-input" type="text" name="allergie" placeholder="(optionnel)">
            </div>

            <div class="rsvp-actions">
                <button type="button" id="rsvpBackBtn" hidden>Précédent</button>
                <button type="submit" id="rsvpNextBtn">Continuer</button>
            </div>

            <div id="rsvpFormStatus" class="rsvp-form-status" aria-live="polite"></div>
        </form>
    `;

    mount.innerHTML = formHtml;

    const form = document.getElementById('rsvpForm');
    const status = document.getElementById('rsvpFormStatus');
    const nextBtn = document.getElementById('rsvpNextBtn');
    const backBtn = document.getElementById('rsvpBackBtn');
    const submitFrame = document.getElementById('rsvpSubmitFrame');

    let step = 'presence';
    let flow = null; // 'yes' | 'no'

    // Tampon initial: check email
    const checkBtn = document.getElementById('rsvpCheckBtn');
    const emailInput = document.getElementById('rsvpEmail');
    const checkResult = document.getElementById('rsvpCheckResult');
    const checkWrap = document.getElementById('rsvp-check');

    // Hide form until email check passes
    mount.style.display = 'none';

    async function runEmailCheck() {
        const email = String(emailInput?.value || '').trim();
        if (!email) {
            if (checkResult) checkResult.textContent = '';
            return;
        }
        if (!isValidEmail(email)) {
            if (checkResult) checkResult.textContent = 'Veuillez entrer une adresse email valide.';
            return;
        }

        if (checkResult) checkResult.textContent = 'Vérification en cours...';
        try {
            const data = await checkEmailLegacy(email);
            if (data && data.found) {
                if (checkResult) {
                    const fullName = `${String(data.prenom || '').trim()} ${String(data.nom || '').trim()}`.trim();
                    checkResult.textContent = fullName
                        ? `RSVP déjà enregistré pour ${fullName}. Merci !`
                        : 'RSVP déjà enregistré. Merci !';
                }
                // Keep the form hidden
                mount.style.display = 'none';
                return;
            }

            // Not found => hide check UI and show the form
            if (checkResult) checkResult.textContent = '';
            if (checkWrap) checkWrap.style.display = 'none';
            mount.style.display = '';
            // Pre-fill email into the form
            const emailField = form.querySelector('input[name="email"]');
            if (emailField) emailField.value = email;
        } catch (err) {
            if (checkResult) checkResult.textContent = 'Erreur de vérification, réessayez plus tard.';
        }
    }

    if (checkBtn) checkBtn.addEventListener('click', runEmailCheck);
    if (emailInput) {
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                runEmailCheck();
            }
        });
    }

    const steps = {
        presence: form.querySelector('[data-step="presence"]'),
        no: form.querySelector('[data-step="no"]'),
        yes: form.querySelector('[data-step="yes"]'),
        more: form.querySelector('[data-step="more"]'),
    };

    function show(s) {
        Object.entries(steps).forEach(([k, el]) => {
            if (!el) return;
            el.hidden = (k !== s);
        });
        step = s;
        backBtn.hidden = (s === 'presence');
        nextBtn.textContent = (s === 'more' || s === 'no') ? 'Envoyer' : 'Continuer';
        status.textContent = '';
    }

    function getRadioValue(name) {
        const el = form.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : '';
    }

    function getCheckedValues(name) {
        const els = Array.from(form.querySelectorAll(`input[name="${name}"]:checked`));
        return els.map(e => e.value);
    }

    function validateCurrentStep() {
        if (step === 'presence') {
            const presence = getRadioValue('presence');
            if (!presence) return 'Choisis une option.';
            return null;
        }

        if (step === 'no') {
            const nomComplet = String(form.elements.nomComplet.value || '').trim();
            if (!nomComplet) return 'Indique ton nom complet.';
            return null;
        }

        if (step === 'yes') {
            const required = ['nom', 'prenom', 'email', 'telephone', 'codePostal', 'ville', 'adresse1'];
            const missing = required.filter((k) => !String(form.elements[k].value || '').trim());
            if (missing.length) return 'Merci de remplir tous les champs obligatoires.';

            const email = String(form.elements.email.value || '').trim();
            if (!isValidEmail(email)) return 'Email invalide.';
            return null;
        }

        if (step === 'more') {
            const alcool = getRadioValue('alcool');
            if (!alcool) return 'Choisis une préférence alcoolisée.';
            return null;
        }

        return null;
    }

    function buildSubmitPayload() {
        const presence = getRadioValue('presence');
        const isYes = presence === 'Oui, je serai là';
        const isNo = presence === 'Désolé, je ne pourrai pas venir :(';

        // If multiple checked, join with " | " to keep the cell readable.
        const regime = getCheckedValues('regime').join(' | ');

        return {
            presence,
            nomComplet: isNo ? String(form.elements.nomComplet.value || '').trim() : '',
            nom: isYes ? String(form.elements.nom.value || '').trim() : '',
            prenom: isYes ? String(form.elements.prenom.value || '').trim() : '',
            email: isYes ? String(form.elements.email.value || '').trim() : '',
            telephone: isYes ? String(form.elements.telephone.value || '').trim() : '',
            codePostal: isYes ? String(form.elements.codePostal.value || '').trim() : '',
            ville: isYes ? String(form.elements.ville.value || '').trim() : '',
            adresse1: isYes ? String(form.elements.adresse1.value || '').trim() : '',
            regime: isYes ? regime : '',
            alcool: isYes ? getRadioValue('alcool') : '',
            allergie: isYes ? String(form.elements.allergie.value || '').trim() : '',
        };
    }

    function submitViaFormPost(payload) {
        return new Promise((resolve) => {
            // Because this is cross-origin, we can't read the response.
            // We treat frame load as "request completed" and show a success message.
            const tmpForm = document.createElement('form');
            tmpForm.method = 'POST';
            tmpForm.action = SUBMIT_URL;
            tmpForm.target = 'rsvpSubmitFrame';
            tmpForm.style.position = 'absolute';
            tmpForm.style.left = '-9999px';
            tmpForm.style.top = '-9999px';

            Object.entries(payload).forEach(([k, v]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = k;
                input.value = (v === undefined || v === null) ? '' : String(v);
                tmpForm.appendChild(input);
            });

            const onLoad = () => {
                submitFrame.removeEventListener('load', onLoad);
                tmpForm.remove();
                resolve(true);
            };
            submitFrame.addEventListener('load', onLoad);

            document.body.appendChild(tmpForm);
            tmpForm.submit();

            // Safety: resolve anyway after 12s
            setTimeout(() => {
                try { submitFrame.removeEventListener('load', onLoad); } catch (_) {}
                try { tmpForm.remove(); } catch (_) {}
                resolve(true);
            }, 12000);
        });
    }

    form.addEventListener('change', () => {
        if (step === 'presence') {
            const presence = getRadioValue('presence');
            if (presence === 'Oui, je serai là') flow = 'yes';
            else if (presence === 'Désolé, je ne pourrai pas venir :(') flow = 'no';
            else flow = null;
        }
    });

    backBtn.addEventListener('click', () => {
        if (step === 'yes' || step === 'no') show('presence');
        else if (step === 'more') show('yes');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = validateCurrentStep();
        if (err) {
            status.textContent = err;
            return;
        }

        if (step === 'presence') {
            show(flow === 'no' ? 'no' : 'yes');
            return;
        }

        if (step === 'yes') {
            show('more');
            return;
        }

        // Final step: submit
        const payload = buildSubmitPayload();
        status.textContent = 'Envoi en cours...';
        nextBtn.disabled = true;
        backBtn.disabled = true;

        await submitViaFormPost(payload);

        // Success UI
        mount.innerHTML = `
            <div class="rsvp-success" style="text-align:center;padding:1rem 0;">
                <div style="font-size:1.4rem;font-weight:700;color:var(--burgundy);">Merci !</div>
                <div style="margin-top:0.5rem;color:rgba(0,0,0,0.7);">Ton RSVP a bien été enregistré.</div>
            </div>
        `;
    });

    show('presence');
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



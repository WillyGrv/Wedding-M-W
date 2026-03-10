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
    const formHtml = `
        <div style="width:100%;display:flex;justify-content: flex-end;margin-bottom: 2%;">
            <button id="rsvpRetourBtn" style="padding:8px 16px;border-radius:8px;border:none;background:#eee;font-weight:500;cursor:pointer;">Retour</button>
        </div>

        <form id="rsvpForm" class="rsvp-form" novalidate>
            <div class="rsvp-step" data-step="presence">
                <p style="margin-top:0;font-weight:600;">Est-ce que je serai présent pour ce mariage du siècle ?</p>
                <label class="rsvp-radio"><input type="radio" name="presence" value="Oui, je serai là" required> Oui, je serai là</label>
                <label class="rsvp-radio"><input type="radio" name="presence" value="Désolé, je ne pourrai pas venir :(" required> Désolé, je ne pourrai pas venir :(</label>
            </div>

            <div class="rsvp-step" data-step="no" hidden>
                <p style="margin-top:0;font-weight:600;">Oh noooon 😞</p>
                <label class="rsvp-label">Indique-nous ton nom complet que l'on puisse bien confirmer l'info</label>
                <input class="rsvp-input" type="text" name="nomComplet" autocomplete="name" required>
            </div>

            <div class="rsvp-step" data-step="yes" hidden>
                <p style="margin-top:0;font-weight:600;">Youuy ! Trop hâte de te voir ramper !</p>
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
                <p style="margin-top:0;font-weight:600;">Quelques informations sur toi...</p>
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

    // Apps Script RSVP API (same concept as playlist: Web App /exec)
    // NOTE: this is the existing URL you already used for the email pre-check.
    // NOTE: Using /macros/u/1/ avoids a 302 redirect that Chrome may block (ORB) for JSONP script loads.
    const apiBase = 'https://script.google.com/macros/u/1/s/AKfycbx2yNpUdEVuUjQvYxED20KLtaGrnEeyCuaRVJwHdM-e5MYQNrSEels-OOnYROglPXb4TQ/exec';
    const routeUrl = (route) => `${apiBase}${apiBase.includes('?') ? '&' : '?'}route=${encodeURIComponent(route)}`;
    const RSVP_CHECK_URL = routeUrl('/api/rsvp/check-jsonp');
    const RSVP_SUBMIT_URL = routeUrl('/api/rsvp/submit-jsonp');

    // JSONP helper: avoids CORS limitations with Apps Script + GitHub Pages
    function fetchJsonp(url, params = {}) {
        return new Promise((resolve, reject) => {
            const cbName = `wmwJsonp_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
            const fullParams = new URLSearchParams();
            Object.entries(params).forEach(([k, v]) => {
                if (v === undefined || v === null) return;
                fullParams.set(k, String(v));
            });
            fullParams.set('callback', cbName);

            const sep = url.includes('?') ? '&' : '?';
            const src = `${url}${sep}${fullParams.toString()}`;

            const script = document.createElement('script');
            script.async = true;
            script.src = src;

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP timeout'));
            }, 15000);

            function cleanup() {
                clearTimeout(timeout);
                try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
                script.remove();
            }

            window[cbName] = (data) => {
                cleanup();
                resolve(data);
            };

            script.onerror = () => {
                cleanup();
                reject(new Error('JSONP network error'));
            };

            document.head.appendChild(script);
        });
    }

    function restoreRsvpCard(e) {
        if (e) e.preventDefault();
        rsvpCard.innerHTML = originalHTML;
        rsvpCard.style.width = '';
        rsvpCard.style.height = '';
        rsvpCard.style.maxWidth = '';
        rsvpCard.style.maxHeight = '';
        rsvpCard.classList.remove('rsvp-expanded');
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
                    const data = await fetchJsonp(RSVP_CHECK_URL, { email });
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
                                                                rsvpCard.classList.add('rsvp-expanded');
                                                                rsvpCard.innerHTML = formHtml;
                                const retourBtn = rsvpCard.querySelector('#rsvpRetourBtn');
                                if (retourBtn) {
                                    retourBtn.addEventListener('click', restoreRsvpCard);
                                }

                                                                // Custom RSVP form behavior (multi-step + submit)
                                                                const $form = rsvpCard.querySelector('#rsvpForm');
                                                                const $status = rsvpCard.querySelector('#rsvpFormStatus');
                                                                const $next = rsvpCard.querySelector('#rsvpNextBtn');
                                                                const $back = rsvpCard.querySelector('#rsvpBackBtn');

                                                                const steps = {
                                                                    presence: rsvpCard.querySelector('.rsvp-step[data-step="presence"]'),
                                                                    no: rsvpCard.querySelector('.rsvp-step[data-step="no"]'),
                                                                    yes: rsvpCard.querySelector('.rsvp-step[data-step="yes"]'),
                                                                    more: rsvpCard.querySelector('.rsvp-step[data-step="more"]'),
                                                                };

                                                                let flow = null; // 'yes' | 'no'
                                                                let page = 'presence';

                                                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                                                                function setStatus(msg, type = 'info') {
                                                                    if (!$status) return;
                                                                    $status.textContent = msg || '';
                                                                    $status.style.color = (type === 'error') ? '#b00020' : 'var(--sage)';
                                                                }

                                                                function showStep(name) {
                                                                    Object.entries(steps).forEach(([k, el]) => {
                                                                        if (!el) return;
                                                                        el.hidden = (k !== name);
                                                                    });
                                                                    page = name;
                                                                    if ($back) $back.hidden = (name === 'presence');

                                                                    if ($next) {
                                                                        if (name === 'more') $next.textContent = 'Envoyer';
                                                                        else if (name === 'no') $next.textContent = 'Envoyer';
                                                                        else $next.textContent = 'Continuer';
                                                                    }
                                                                    setStatus('');
                                                                }

                                                                function getPresenceValue() {
                                                                    const checked = $form.querySelector('input[name="presence"]:checked');
                                                                    return checked ? checked.value : '';
                                                                }

                                                                function collectRegimes() {
                                                                    const boxes = Array.from($form.querySelectorAll('input[name="regime"]:checked'));
                                                                    return boxes.map(b => b.value);
                                                                }

                                                                function validateCurrentStep() {
                                                                    if (page === 'presence') {
                                                                        const v = getPresenceValue();
                                                                        if (!v) return 'Choisissez une option pour continuer.';
                                                                        return '';
                                                                    }

                                                                    if (page === 'no') {
                                                                        const nomComplet = ($form.nomComplet?.value || '').trim();
                                                                        if (!nomComplet) return 'Merci d’indiquer ton nom complet.';
                                                                        return '';
                                                                    }

                                                                    if (page === 'yes') {
                                                                        const nom = ($form.nom?.value || '').trim();
                                                                        const prenom = ($form.prenom?.value || '').trim();
                                                                        const email2 = ($form.email?.value || '').trim();
                                                                        const tel = ($form.telephone?.value || '').trim();
                                                                        const cp = ($form.codePostal?.value || '').trim();
                                                                        const ville = ($form.ville?.value || '').trim();
                                                                        const adr = ($form.adresse1?.value || '').trim();

                                                                        if (!nom || !prenom || !email2 || !tel || !cp || !ville || !adr) return 'Merci de remplir tous les champs.';
                                                                        if (!emailRegex.test(email2)) return 'Veuillez entrer une adresse email valide.';
                                                                        return '';
                                                                    }

                                                                    if (page === 'more') {
                                                                        const regimes = collectRegimes();
                                                                        const alcool = ($form.querySelector('input[name="alcool"]:checked') || {}).value || '';
                                                                        if (!regimes.length) return 'Choisis au moins une option pour le régime alimentaire.';
                                                                        if (!alcool) return 'Choisis une préférence alcoolisée.';
                                                                        return '';
                                                                    }

                                                                    return '';
                                                                }

                                                                async function submitRsvp(payload) {
                                                                    try {
                                                                        $next.disabled = true;
                                                                        if ($back) $back.disabled = true;
                                                                        setStatus('Envoi en cours…');

                                                                        const payloadFlat = { ...payload };
                                                                        Object.entries(payloadFlat).forEach(([k, v]) => {
                                                                            if (Array.isArray(v)) payloadFlat[k] = v.join(' | ');
                                                                        });

                                                                        const data2 = await fetchJsonp(RSVP_SUBMIT_URL, payloadFlat);
                                                                        if (!data2 || data2.success !== true) {
                                                                            const msg = (data2 && (data2.message || data2.error)) ? (data2.message || data2.error) : 'Envoi échoué.';
                                                                            throw new Error(msg);
                                                                        }

                                                                        rsvpCard.innerHTML = `<div class="rsvp-success" style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;text-align:center;font-size:1.15rem;color:var(--burgundy);font-weight:600;position:relative;">
                                                                            <span>Merci ! Ton RSVP a bien été enregistré.</span>
                                                                            <div style="margin-top:0.75rem;font-weight:500;color:var(--sage);">À très vite ❤️</div>
                                                                        </div>`;
                                                                    } catch (e) {
                                                                        setStatus(e.message || 'Erreur pendant l\'envoi.', 'error');
                                                                    } finally {
                                                                        $next.disabled = false;
                                                                        if ($back) $back.disabled = false;
                                                                    }
                                                                }

                                                                // Init
                                                                showStep('presence');

                                                                $form.addEventListener('change', (ev) => {
                                                                    if (ev.target && ev.target.name === 'presence') {
                                                                        const v = getPresenceValue();
                                                                        flow = (v === 'Oui, je serai là') ? 'yes' : (v ? 'no' : null);
                                                                    }
                                                                });

                                                                if ($back) {
                                                                    $back.addEventListener('click', () => {
                                                                        if (page === 'no' || page === 'yes') return showStep('presence');
                                                                        if (page === 'more') return showStep('yes');
                                                                    });
                                                                }

                                                                $form.addEventListener('submit', async (ev) => {
                                                                    ev.preventDefault();
                                                                    const errMsg = validateCurrentStep();
                                                                    if (errMsg) {
                                                                        setStatus(errMsg, 'error');
                                                                        return;
                                                                    }

                                                                    if (page === 'presence') {
                                                                        // branch
                                                                        const v = getPresenceValue();
                                                                        flow = (v === 'Oui, je serai là') ? 'yes' : 'no';
                                                                        return showStep(flow);
                                                                    }

                                                                    if (page === 'yes') {
                                                                        return showStep('more');
                                                                    }

                                                                    // Submit (no or more)
                                                                    const presence = getPresenceValue();
                                                                    const nowIso = new Date().toISOString();

                                                                    if (page === 'no') {
                                                                        const payload = {
                                                                            presence,
                                                                            nomComplet: ($form.nomComplet?.value || '').trim(),
                                                                            submittedAt: nowIso,
                                                                        };
                                                                        return submitRsvp(payload);
                                                                    }

                                                                    if (page === 'more') {
                                                                        const payload = {
                                                                            presence,
                                                                            nom: ($form.nom?.value || '').trim(),
                                                                            prenom: ($form.prenom?.value || '').trim(),
                                                                            email: ($form.email?.value || '').trim(),
                                                                            telephone: ($form.telephone?.value || '').trim(),
                                                                            codePostal: ($form.codePostal?.value || '').trim(),
                                                                            ville: ($form.ville?.value || '').trim(),
                                                                            adresse1: ($form.adresse1?.value || '').trim(),
                                                                            regime: collectRegimes(),
                                                                            alcool: ($form.querySelector('input[name="alcool"]:checked') || {}).value || '',
                                                                            allergie: ($form.allergie?.value || '').trim(),
                                                                            submittedAt: nowIso,
                                                                        };
                                                                        return submitRsvp(payload);
                                                                    }
                                                                });
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



import { gsap, qs, qsa, reduced, heroIn, fitCalendar } from './prisma-site.js';
import { sendContactForm, CONTACT_FORM_MESSAGES } from './contactForm.js';

// /contacto on the Prisma design. The form keeps the exact contract of the
// previous page: same fields (nombre, email, empresa, mensaje), same token and
// reCAPTCHA action, same endpoint (see src/contactForm.js).

const hero = qs('.hero-contact');
heroIn(hero);
// The hello drifts a little slower than the page as it scrolls away.
if (!reduced) {
    gsap.to('.hero-contact__visual', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}

// The two hero choices share a height at rest, the one of the tallest title
// (one of them may wrap and the other not). See .choice in src/prisma-pages.css.
const choices = qs('.choices');
if (choices) {
    const titles = qsa('.choice__title', choices);
    const fit = () => choices.style.setProperty('--rest', `${Math.max(...titles.map(t => t.offsetHeight))}px`);
    const ro = new ResizeObserver(fit);
    titles.forEach(t => ro.observe(t));
}

fitCalendar(qs('.book__card iframe'));

// "Barcelona · 10:42": the time at the office, for whoever thinks of coming by.
const clock = qs('[data-clock] time');
if (clock) {
    const fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
}

const form = qs('#contactForm');
if (form) {
    const status = qs('#formStatus', form);
    const submit = qs('#submitBtn', form);
    const label = qs('span', submit);

    const setStatus = (text, kind) => {
        status.textContent = text;
        status.classList.toggle('is-ok', kind === 'ok');
        status.classList.toggle('is-error', kind === 'error');
    };

    // The message grows with what people write.
    const textarea = qs('textarea', form);
    const grow = () => { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight}px`; };
    textarea.addEventListener('input', grow);

    form.addEventListener('submit', async e => {
        e.preventDefault();
        setStatus('', null);
        submit.disabled = true;
        const original = label.textContent;
        label.textContent = 'Enviando…';

        // Only the named fields travel; the privacy checkbox is just a gate.
        const fields = Object.fromEntries(new FormData(form).entries());
        try {
            await sendContactForm(fields);
            setStatus(CONTACT_FORM_MESSAGES.ok, 'ok');
            form.reset();
            grow();
        } catch (error) {
            console.error('Error:', error);
            setStatus(CONTACT_FORM_MESSAGES.error, 'error');
        } finally {
            submit.disabled = false;
            label.textContent = original;
        }
    });
}

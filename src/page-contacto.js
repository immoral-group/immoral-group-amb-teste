import { gsap, qs, reduced, heroIn } from './prisma-site.js';
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

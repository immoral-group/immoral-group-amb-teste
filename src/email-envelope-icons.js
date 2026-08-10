// Los sobres del hero de email-marketing.html solo empiezan su animación de
// entrada (envelope-enter, en style.css) cuando el usuario hace scroll y llega
// a esa sección — antes están a opacity:0 y quietos. Un IntersectionObserver
// añade .envelope-visible a cada uno (una sola vez) al entrar en el viewport.
//
// Esa animación usa animation-fill-mode:both, así que al terminar sigue
// "reteniendo" la propiedad transform, lo que bloquearía el :hover (que también
// anima transform). Al terminar, se limpia el estilo inline para dejar el
// elemento libre y que el hover funcione con normalidad.
export function initEmailEnvelopeIcons() {
    const section = document.querySelector('.email-hero-section');
    if (!section) return;
    if (section.dataset.envelopeObserverBound === 'true') return;
    section.dataset.envelopeObserverBound = 'true';

    const wraps = section.querySelectorAll('.envelope-wrap');
    if (!wraps.length) return;

    wraps.forEach((el) => {
        el.addEventListener('animationend', (e) => {
            if (e.animationName === 'envelope-enter') {
                el.style.animation = 'none';
                el.style.opacity = '1';
            }
        });
    });

    const layer = wraps[0].parentElement;
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                wraps.forEach((el) => el.classList.add('envelope-visible'));
                observer.disconnect();
            });
        },
        { threshold: 0.25 }
    );
    observer.observe(layer);
}

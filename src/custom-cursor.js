const HOVER_SELECTOR = 'a, button, input, textarea, select, label, [role="button"], [tabindex], .cursor-pointer';

let cursor;
let listenersAttached = false;

export function initCustomCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    if (!cursor || !document.body.contains(cursor)) {
        cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML = '<span class="cc-dot"></span>';
        document.body.appendChild(cursor);
    }

    if (listenersAttached) return;
    listenersAttached = true;

    window.addEventListener('mousemove', (e) => {
        if (!cursor) return;
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        cursor.classList.remove('is-hidden');
    });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(HOVER_SELECTOR)) cursor?.classList.add('is-hover');
    }, true);

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(HOVER_SELECTOR)) cursor?.classList.remove('is-hover');
    }, true);

    document.documentElement.addEventListener('mouseleave', () => cursor?.classList.add('is-hidden'));
}

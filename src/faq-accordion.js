export function initFAQAccordion() {
    const headers = document.querySelectorAll('.faq-header');

    const closeItem = (header) => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.faq-icon');
        content.style.maxHeight = null;
        content.classList.add('opacity-0');
        icon.classList.remove('rotate-180');
        header.setAttribute('aria-expanded', 'false');
    };

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.faq-icon');
            const isOpen = !!content.style.maxHeight;

            // Cierra las demás preguntas del mismo bloque antes de abrir/cerrar esta.
            const group = header.closest('section') || document;
            group.querySelectorAll('.faq-header').forEach(otherHeader => {
                if (otherHeader !== header) closeItem(otherHeader);
            });

            if (isOpen) {
                closeItem(header);
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                content.classList.remove('opacity-0');
                icon.classList.add('rotate-180');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

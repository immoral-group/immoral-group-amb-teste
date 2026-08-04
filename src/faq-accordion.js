export function initFAQAccordion() {
    const headers = document.querySelectorAll('.faq-header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.faq-icon');

            // Close other items (Optional - keeping generic "one open at a time" feel or independent? User said "abrirá una respuesta". Usually nice to close others, but I'll keeping it independent as requested implies simple open.)
            // Actually, for "Difference" sections, usually independent is fine. But let's check if I should auto-close.
            // Let's stick to simple independent toggl first.

            if (content.style.maxHeight) {
                // Close
                content.style.maxHeight = null;
                content.classList.add('opacity-0');
                icon.classList.remove('rotate-180');
                header.setAttribute('aria-expanded', 'false');
            } else {
                // Open
                content.style.maxHeight = content.scrollHeight + "px";
                content.classList.remove('opacity-0');
                icon.classList.add('rotate-180');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

import { qs, qsa, heroIn, finePointer } from './prisma-site.js';
// Results (figures cut by the line of the logo), parallax and clips that play
// on screen are the service pages' own: each block there only acts if the
// page has it, so a case page reuses them as they are.
import './page-service.js';

// A case page on the Prisma design (caso-<slug>.html, generated from Supabase
// by scripts/generate-case-studies.mjs for the slugs in PRISMA_CASES).

/* Hero: title, copy and the cover come in after the page intro -------- */
const hero = qs('.hero-case');
if (hero) heroIn(hero);

/* More cases: each card plays its clip only while the pointer is on it -- */
qsa('.case-next .case-card').forEach(card => {
    const video = qs('.case-card__video', card);
    if (!video || !finePointer) return;
    card.addEventListener('mouseenter', () => {
        video.currentTime = 0;
        // A case without a clip yet: play() rejects and the cover stays.
        video.play().then(() => card.classList.add('is-playing')).catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
        card.classList.remove('is-playing');
        video.pause();
    });
});

import { qs, heroIn, magnetic, ScrollTrigger } from './prisma-site.js';
import { initOfertaDetail } from './ofertaDetail.js';

// /oferta.html on the Prisma design. The offer arrives from Supabase after
// the page loads, so the hero entrance and the magnetic buttons are set up
// once it is drawn (prisma-site.js only sees what was there at load).
const root = qs('#oferta-detail-root');
initOfertaDetail()
    .then(() => {
        heroIn(qs('[data-hero]', root));
        magnetic(root);
        ScrollTrigger.refresh();
    })
    .catch(err => console.error('Oferta:', err));

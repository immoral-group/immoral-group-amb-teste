import { qs, heroIn } from './prisma-site.js';

// 404.html on the Prisma design: the shared behaviour (nav, footer, cookie
// notice) comes with prisma-site.js; here only the entrance of the message.
heroIn(qs('.lost'));

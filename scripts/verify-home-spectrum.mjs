import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const original = fs.readFileSync('index.html', 'utf8');
const copy = fs.readFileSync('index-spectrum.html', 'utf8');
const normalize = text => text.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
const body = normalize(copy);
let checked = 0;
for (const section of original.matchAll(/<section\b[\s\S]*?<\/section>/g)) {
    for (const block of section[0].matchAll(/<(p|h1|h2|h3|button)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
        const text = normalize(block[2]);
        if (text.length < 10) continue;
        assert.ok(body.includes(text), `Texto original ausente: ${text}`);
        checked++;
    }
}
for (const target of [15, 28, 60]) assert.ok(copy.includes(`data-count="${target}"`));
for (const match of copy.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(url)) continue;
    const relative = url.split('#')[0].replace(/^\//, '');
    const path = /^(imgs|fonts|videos)\//.test(relative) ? `public/${relative}` : relative;
    assert.ok(fs.existsSync(path), `Recurso local ausente: ${path}`);
}
const baseline = JSON.parse(fs.readFileSync('.brianspec/home-spectrum-baseline.json','utf8'));
for (const [path, hash] of Object.entries(baseline)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'), hash, `Se ha modificado ${path}`);
}
assert.equal((copy.match(/<section\b/g) || []).length,10,'Se conservan las diez secciones de las propuestas anteriores');
assert.ok(copy.includes('noindex,follow'));
assert.ok(!copy.includes('/src/main.js') && !copy.includes('/src/home-color') && !copy.includes('/src/home-bold'));
assert.ok(!/personaje|mascot|character-|home-universe\.(js|css)/i.test(copy),'La propuesta no incorpora personajes ni recursos de la opción anterior');
const expectedOrder=['spectrum-hero','intro-section','doors-section','services-section','contact-section','reasons-section','process-section','results-section','testimonials-section','faq-section'];
let last=-1;
for(const name of expectedOrder){const position=copy.indexOf(name);assert.ok(position>last,`Orden de sección incorrecto: ${name}`);last=position;}
console.log(`OK: ${checked} textos originales, 10 secciones, recursos locales y las cuatro versiones previas intactas.`);



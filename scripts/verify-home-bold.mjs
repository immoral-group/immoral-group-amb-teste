import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const original = fs.readFileSync('index.html', 'utf8');
const copy = fs.readFileSync('index-bold.html', 'utf8');
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
    const path = /^(imgs|fonts)\//.test(relative) ? `public/${relative}` : relative;
    assert.ok(fs.existsSync(path), `Recurso local ausente: ${path}`);
}
assert.ok(copy.includes('noindex,follow'));
assert.ok(!copy.includes('/src/main.js') && !copy.includes('/src/home-color'));
const preserved = {
    'index.html': '015D1E43E44A6CBD8E7938D54780057A7E624BC2BDD150AF12CB38097EC5DE70',
    'index-color.html': '2FAAE6F4283014B9371F37C7EF231CF1010C6C51E25965BA76B9D44D60B292AB',
    'src/home-color.css': '1E0AA9A4334168AF3CB2B2534443DF14D22DE404BC06C8119CFC3CB0B8E1C098',
    'src/home-color.js': '2214FB3E75C1D437F4596B5341EEE6B302DCCD7516D06020546C2101CFBB1FD3',
};
for (const [file, hash] of Object.entries(preserved)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(), hash, `${file} ha cambiado desde el inicio de esta propuesta`);
}
console.log(`OK: ${checked} textos originales conservados, recursos existentes y las dos versiones anteriores intactas.`);

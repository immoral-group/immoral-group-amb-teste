import fs from 'node:fs';
import assert from 'node:assert/strict';
const original = fs.readFileSync('index.html', 'utf8');
const copy = fs.readFileSync('index-color.html', 'utf8');
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
    const file = url.split('#')[0];
    const relative = file.replace(/^\//, '');
    const path = /^(imgs|fonts)\//.test(relative) ? `public/${relative}` : relative;
    assert.ok(fs.existsSync(path), `Recurso local ausente: ${path}`);
}
assert.ok(copy.includes('noindex,follow'));
assert.ok(!copy.includes('src="/src/main.js"'));
console.log(`OK: ${checked} bloques de texto originales conservados; cifras, enlaces y recursos locales verificados.`);

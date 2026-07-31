// Renderizador minimalista para .claude/TASK-LOG.md, mostrado en /logs.
// No usamos una librería de markdown a propósito (P8 — no añadir una
// dependencia para un subconjunto tan pequeño): soporta solo lo que
// CLAUDE.md exige usar en cada entrada del changelog — encabezados,
// negrita, enlaces, listas, párrafos y '---' como separador.

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#3980E4] hover:underline" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code class="text-[#A8FFFF] bg-white/5 px-1 py-0.5 rounded text-[0.85em]">$1</code>');
  return html;
}

/**
 * Convierte el markdown restringido de TASK-LOG.md a HTML.
 * @param {string} markdown
 * @returns {string}
 */
export function renderChangelog(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let listBuffer = [];
  let paraBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      out.push(`<ul class="list-disc pl-5 space-y-1">${listBuffer.join('')}</ul>`);
      listBuffer = [];
    }
  };
  const flushPara = () => {
    if (paraBuffer.length) {
      out.push(`<p>${paraBuffer.map(renderInline).join(' ')}</p>`);
      paraBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushList();
      flushPara();
      continue;
    }
    if (line.trim() === '---') {
      flushList();
      flushPara();
      out.push('<hr class="border-[#2E2E2E]" />');
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      flushPara();
      const level = heading[1].length;
      const sizes = { 1: 'text-xl mt-8 mb-3', 2: 'text-lg mt-8 mb-2', 3: 'text-base mt-4 mb-1' };
      out.push(`<h${level} class="font-semibold text-[#F5F5F5] ${sizes[level]}">${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    const listItem = line.match(/^-\s+(.*)$/);
    if (listItem) {
      flushPara();
      listBuffer.push(`<li>${renderInline(listItem[1])}</li>`);
      continue;
    }

    flushList();
    paraBuffer.push(line.trim());
  }
  flushList();
  flushPara();

  return out.join('\n');
}

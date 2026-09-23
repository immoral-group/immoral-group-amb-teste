let dispose;

// A perspective knowledge graph: the pointer discovers sources and sends
// a visible signal through their connections toward the quotation marks.
export function initGeoSignalField() {
    dispose?.();
    dispose = undefined;
    const host = document.getElementById('geo-signal-field');
    if (!host) return;
    const hero = host.closest('.geo-hero-story');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);

    const events = new AbortController();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const columns = 27, rows = 15;
    const nodes = [];
    const edges = [];
    let seed = 8516;
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const index = nodes.length;
            nodes.push({ row, col, jitterX: (random() - .5) * .4, jitterY: (random() - .5) * .3, x: 0, y: 0, light: 0, depth: 0 });
            if (col) edges.push([index - 1, index]);
            if (row) edges.push([index - columns, index]);
            if (col && row && random() > .76) edges.push([index - columns - 1, index]);
        }
    }
    const dust = Array.from({ length: 140 }, () => ({ x: random(), y: random(), depth: random() }));
    const signals = [];
    let width = 1, height = 1, frame = 0, visible = true;
    let elapsed = 0, previousTime = 0, lastSignal = -10, lastSource = -1;
    let pointer = null;
    let pointerX = 0, pointerY = 0;
    let hub = 0;

    // Keep the actual text quiet while allowing the network to glow around it.
    function smoothstep(start, end, value) {
        const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
        return t * t * (3 - 2 * t);
    }
    function readability(x, y) {
        const nx = x / width, ny = y / height;
        const edgeFade = Math.min(1, Math.max(0, ny / .12), Math.max(0, (1 - ny) / .12));
        const textArea = width < 768
            ? .5 - .38 * smoothstep(.04, .18, ny) * (1 - smoothstep(.4, .62, ny))
            : 1 - .9 * (1 - smoothstep(.34, .63, nx)) * smoothstep(.05, .24, ny) * (1 - smoothstep(.65, .92, ny));
        return edgeFade * textArea;
    }

    function project() {
        const drift = reduced.matches ? 0 : elapsed;
        let hubDistance = Infinity;
        for (const node of nodes) {
            const depth = (node.row + node.jitterY) / (rows - 1);
            const lateral = (node.col + node.jitterX) / (columns - 1) * 2 - 1;
            const spread = .26 + depth * .93;
            let x = width * (.64 + lateral * spread * .72);
            let y = height * (.07 + depth * .98);
            y += Math.sin(lateral * 4.2 + depth * 4.8 + drift * .16) * height * .035 * depth;
            x += Math.sin(depth * 6 + drift * .1) * 12 * depth;
            if (pointer && !reduced.matches) {
                const dx = pointerX - x, dy = pointerY - y;
                const influence = Math.exp(-(dx * dx + dy * dy) / 46000);
                x += dx * influence * .09;
                y += dy * influence * .09;
                node.light = influence;
            } else node.light = 0;
            node.x = x;
            node.y = y;
            node.depth = depth;
            const distance = (x - width * .75) ** 2 + (y - height * .5) ** 2;
            if (distance < hubDistance) { hubDistance = distance; hub = node.row * columns + node.col; }
        }
    }

    function trace(source) {
        const route = [source];
        let { row, col } = nodes[source];
        const target = nodes[hub];
        while (row !== target.row || col !== target.col) {
            if (Math.abs(target.col - col) > Math.abs(target.row - row)) col += Math.sign(target.col - col);
            else row += Math.sign(target.row - row);
            route.push(row * columns + col);
        }
        return route;
    }

    function discover() {
        if (!pointer || reduced.matches || elapsed - lastSignal < .45) return;
        let nearest = -1, distance = 180 ** 2;
        nodes.forEach((node, index) => {
            const d = (node.x - pointerX) ** 2 + (node.y - pointerY) ** 2;
            if (d < distance) { nearest = index; distance = d; }
        });
        if (nearest < 0 || (nearest === lastSource && elapsed - lastSignal < 2)) return;
        signals.push({ route: trace(nearest), born: elapsed });
        if (signals.length > 5) signals.shift();
        lastSource = nearest;
        lastSignal = elapsed;
    }

    function line(a, b, alpha, weight = .55) {
        ctx.strokeStyle = `rgba(204,216,232,${alpha})`;
        ctx.lineWidth = weight;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
    function glow(x, y, radius, alpha) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
        gradient.addColorStop(.14, `rgba(233,240,255,${alpha * .6})`);
        gradient.addColorStop(1, 'rgba(233,240,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        project();
        discover();
        for (const [ia, ib] of edges) {
            const a = nodes[ia], b = nodes[ib];
            const light = Math.max(a.light, b.light);
            const alpha = (.055 + a.depth * .065 + light * .24) * readability((a.x + b.x) / 2, (a.y + b.y) / 2);
            line(a, b, alpha);
        }
        for (const node of nodes) {
            const visibility = readability(node.x, node.y);
            ctx.fillStyle = `rgba(220,230,244,${(.16 + node.depth * .19 + node.light * .5) * visibility})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, .65 + node.depth * .55 + node.light * .5, 0, Math.PI * 2);
            ctx.fill();
            if (node.light > .6) glow(node.x, node.y, 7, node.light * .4 * visibility);
        }
        for (const dot of dust) {
            const x = dot.x * width;
            const y = ((dot.y + elapsed * .0015 * dot.depth) % 1) * height;
            ctx.fillStyle = `rgba(212,224,239,${(.1 + dot.depth * .19) * readability(x, y)})`;
            ctx.fillRect(x, y, 1, 1);
        }
        if (reduced.matches) return;
        for (let i = signals.length - 1; i >= 0; i--) {
            const signal = signals[i];
            const progress = Math.max(0, (elapsed - signal.born) * 6);
            if (progress > signal.route.length + 4) { signals.splice(i, 1); continue; }
            for (let j = 1; j < signal.route.length; j++) {
                const trail = Math.max(0, 1 - Math.abs(progress - j) / 3);
                if (!trail) continue;
                const a = nodes[signal.route[j - 1]], b = nodes[signal.route[j]];
                line(a, b, trail * .65 * readability((a.x + b.x) / 2, (a.y + b.y) / 2), 1);
            }
            const segment = Math.min(Math.floor(progress), signal.route.length - 1);
            const a = nodes[signal.route[segment]];
            const b = nodes[signal.route[Math.min(segment + 1, signal.route.length - 1)]];
            const t = progress % 1;
            const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
            glow(x, y, 12, Math.max(0, 1 - Math.max(0, progress - signal.route.length) / 4) * readability(x, y));
        }
    }

    function tick(now) {
        frame = 0;
        elapsed += Math.max(0, Math.min((now - previousTime) / 1000, .05));
        previousTime = now;
        if (pointer) {
            pointerX += (pointer.x - pointerX) * .1;
            pointerY += (pointer.y - pointerY) * .1;
        }
        draw();
        if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    }
    function sync() {
        const animate = visible && !document.hidden && !reduced.matches;
        if (animate && !frame) {
            previousTime = performance.now();
            frame = requestAnimationFrame(tick);
        } else if (!animate) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        if (reduced.matches) { signals.length = 0; draw(); }
    }
    function resize() {
        width = host.clientWidth;
        height = host.clientHeight;
        if (!width || !height) return;
        const dpr = Math.min(devicePixelRatio || 1, 1.75);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        signals.length = 0;
        draw();
    }
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(host);
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    visibilityObserver.observe(host);
    hero.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || reduced.matches) return;
        const bounds = host.getBoundingClientRect();
        const next = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        if (!pointer) { pointerX = next.x; pointerY = next.y; }
        pointer = next;
    }, { signal: events.signal, passive: true });
    hero.addEventListener('pointerleave', () => { pointer = null; }, { signal: events.signal });
    document.addEventListener('visibilitychange', sync, { signal: events.signal });
    reduced.addEventListener('change', sync, { signal: events.signal });

    dispose = () => {
        cancelAnimationFrame(frame);
        events.abort();
        sizeObserver.disconnect();
        visibilityObserver.disconnect();
        canvas.remove();
    };
}

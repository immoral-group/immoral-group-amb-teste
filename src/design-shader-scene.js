// Escultura raymarcheada (WebGL2 puro) que reemplaza el iframe de Spline del hero
// de Diseño de Marca. Misma interacción de arrastre que el original (rota la cámara
// alrededor de la pieza), más el giro de la pieza atado al scroll, un giro propio
// lento y constante, y un balanceo de cámara sutil (los tres independientes del
// mouse). Sin editor/controles de desarrollo. Degradado cíclico igual en
// estructura al original (mismo teñido por posición+tiempo, misma curva de
// seno), pero con la paleta negro -> azul de marca #3B82F6 -> cian de la web
// #65fefa -> blanco, en vez del arcoíris RGB completo.
// Fuente original: https://codepen.io/atzedent/pen/QwdOWmZ (Matthias Hurrle @atzedent)

const VERTEX_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform float phase;
uniform float idleTime;
uniform vec2 resolution;
uniform vec2 move;
#define FC gl_FragCoord.xy
#define R resolution
#define T phase
#define N normalize
#define MN min(R.x,R.y)
#define rot(a) mat2(cos((a)-vec4(0,11,33,0)))

// Paleta cíclica igual en estructura a la del codepen original (misma "t" suave
// vía seno, mismo look de degradado en movimiento), pero recorriendo negro ->
// azul de marca -> cian de la web (#65fefa, ya usado en esta misma página) ->
// blanco, en vez del arcoíris RGB completo. Los tres tramos son contiguos (cada
// uno empieza justo donde termina el anterior, sin meseta de color plano en
// medio) para que la mezcla sea difuminada de punta a punta, como el original.
vec3 hue(float a) {
    vec3 black=vec3(0.);
    vec3 blue=vec3(.231,.510,.965);
    vec3 cyan=vec3(.396,.996,.980);
    vec3 white=vec3(1.);
    float t=.5+.5*sin(6.3*a);
    vec3 c=mix(black, blue, smoothstep(.0,.333,t));
    c=mix(c, cyan, smoothstep(.333,.667,t));
    c=mix(c, white, smoothstep(.667,1.0,t));
    return c;
}

float box(vec3 p, vec3 s, float r) {
    p=abs(p)-s+r;
    return length(max(p,.0))+min(.0,max(max(p.x,p.y),p.z))-r;
}
float smin(float a, float b, float k) {
    float h=clamp(.5+.5*(b-a)/k,.0,1.);
    return mix(b,a,h)-k*h*(1.-h);
}
float cuts(vec3 p, float k, float f) {
    return min(
        box(p,vec3(k,k,f),.05),
        box(p.zyx,vec3(k,k,f),.05)
    );
}
float map(vec3 p) {
    float r=2.8, a=atan(p.x,p.z);
    vec2 q=vec2(length(p.xz)-r,p.y);
    q*=rot(.5*a+T);
    q.y=abs(q.y)-.2;
    q.y=abs(q.y)-.2;
    float d=box(q.xyy,vec3(.7,.05,1.+sin(a)*.5+.5),.05);
    return smin(-cuts(p,5.,.2),d,-.05);
}
vec3 norm(vec3 p) {
    float h=1e-3; vec2 k=vec2(-1,1);
    return N(
        k.xyy*map(p+k.xyy*h)+
        k.yxy*map(p+k.yxy*h)+
        k.yyx*map(p+k.yyx*h)+
        k.xxx*map(p+k.xxx*h)
    );
}
bool march(inout vec3 p, vec3 rd, out float dd) {
    for (float i=0.; i<400.; i++) {
        float d=map(p);
        if (abs(d)<1e-3) return true;
        if (d>100.) return false;
        p+=rd*d*.5;
        dd+=d*.5;
    }
    return false;
}
float calcAO(vec3 p, vec3 n) {
    float occ=.0, sca=1.;
    for (float i=.0; i<5.; i++) {
        float
        h=.01+i*.05,
        d=map(p+h*n);
        occ+=(h-d)*sca;
        sca*=.95;
        if (occ>.35) break;
    }
    return clamp(1.-3.*occ,.0,1.)*(.5+.5*n.y);
}
float shadow(vec3 p, vec3 lp) {
    float shd=1., maxd=distance(lp,p);
    vec3 l=N(lp-p);
    for (float i=1e-3; i<maxd;) {
        float d=map(p+l*i);
        if (d<1e-3) {
            shd=.0;
            break;
        }
        shd=min(shd,16.*d/i);
        i+=d;
    }
    return shd;
}
vec3 org(inout vec3 t) {
    // Balanceo constante (no depende del mouse ni del scroll): más notorio que
    // antes, pero sigue siendo un vaivén lento, no un giro vertiginoso.
    float wob1=sin(idleTime*.4)*.09, wob2=cos(idleTime*.3)*.07;
    vec3 p=t-vec3(0,-.5,30);
    p.yz*=rot(.78+wob1-.5*sin(move.y*6.3/MN));
    p.xz*=rot(.78+wob2-move.x*6.3/MN);
    return p;
}
vec3 dir(vec2 uv, vec3 p, vec3 t, float z) {
    vec3 up=vec3(0,1,0),
    f=N(t-p),
    r=N(cross(up,f)),
    u=N(cross(f,r));
    return mat3(r,u,f)*N(vec3(uv,z));
}
vec3 render(vec2 uv) {
    vec3 col=vec3(0),
    t=vec3(0,-.5,0), p=org(t), ro=p,
    rd=dir(uv,p,t,2.);
    float dd;
    if (march(p,rd,dd)) {
        vec3 n=norm(p), lp=vec3(0,3,0), l=N(lp-p),
        e=N(ro-p), r=reflect(-l,n);
        float ao=calcAO(p,n), amb=1.+10.*n.y, ld=distance(ro,p),
        dif=clamp(dot(l,n),.0,1.), atten=1./(1.+ld*.25+ld*ld*.125),
        shd=shadow(p+n*5e-2,lp), ref=pow(clamp(dot(r,e),.0,1.),8.);
        // Mismo teñido por posición+tiempo que el original (T*.2-.4*length(p)),
        // con la paleta negro/azul/cian/blanco en vez del arcoíris.
        vec3 tint=hue(T*.2-.4*length(p));
        col+=tint*dif*shd;
        col+=tint*clamp(dot(-rd,l),.0,1.)*atten;
        col+=tint*ref;
        col*=2.+.4*amb*ao*atten;
        // Tonemap por luminancia (no por canal): satura el brillo sin lavar el
        // tono a un gris neutro en las zonas más brillantes.
        float v=max(col.r,max(col.g,col.b));
        if (v>0.) col*=(2.*v/(2.+v))/v;
    }
    return col;
}
void main() {
    vec2 uv=(FC-.5*R)/MN;
    vec3 col=render(uv);
    // Dither: rompe el "banding" del degradado (el salto en escalones que se ve
    // como líneas entre colores) al cuantizar a 8 bits por canal.
    float dither=(fract(sin(dot(FC,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
    col+=dither;
    O=vec4(col,1);
}`;

// Segunda pasada: difumina la escena ya renderizada (desenfoque gaussiano real,
// no solo una transición de color matemáticamente continua) para que se vea
// suave/difuminado de verdad, como la referencia.
const BLUR_FRAGMENT_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform sampler2D uScene;
uniform vec2 resolution;
void main() {
    vec2 uv=gl_FragCoord.xy/resolution;
    vec2 texel=1./resolution;
    vec3 sum=vec3(0.);
    float total=0.;
    for (int y=-3; y<=3; y++) {
        for (int x=-3; x<=3; x++) {
            float w=exp(-float(x*x+y*y)/6.);
            sum+=texture(uScene, uv+vec2(x,y)*texel).rgb*w;
            total+=w;
        }
    }
    O=vec4(sum/total, 1.);
}`;

function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compilando shader:', gl.getShaderInfoLog(shader));
    }
    return shader;
}

export function createDesignShaderScene(container) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block; width:100%; height:100%; touch-action:none;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        console.error('WebGL2 no soportado, no se puede renderizar el fondo interactivo.');
        return { dispose() { canvas.remove(); }, resize() {} };
    }

    function linkProgram(fragmentSrc) {
        const prog = gl.createProgram();
        const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
        const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSrc);
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        // Misma ubicación de atributo en ambos programas (comparten el mismo
        // buffer/quad de pantalla completa) para no tener que reconfigurar
        // vertexAttribPointer al cambiar de programa entre pasadas.
        gl.bindAttribLocation(prog, 0, 'position');
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error('Error enlazando el programa de shaders:', gl.getProgramInfoLog(prog));
        }
        return { prog, vs, fs };
    }

    // Programa de escena (raymarching) + programa de desenfoque (segunda
    // pasada, difumina la textura ya renderizada).
    const scene = linkProgram(FRAGMENT_SRC);
    const blur = linkProgram(BLUR_FRAGMENT_SRC);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(scene.prog, 'resolution');
    const uPhase = gl.getUniformLocation(scene.prog, 'phase');
    const uIdleTime = gl.getUniformLocation(scene.prog, 'idleTime');
    const uMove = gl.getUniformLocation(scene.prog, 'move');
    const uBlurResolution = gl.getUniformLocation(blur.prog, 'resolution');
    const uBlurScene = gl.getUniformLocation(blur.prog, 'uScene');

    // Textura + framebuffer donde se renderiza la escena antes de difuminarla.
    const sceneTexture = gl.createTexture();
    const sceneFBO = gl.createFramebuffer();
    function setupSceneTarget(w, h) {
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // Resolución completa (antes a mitad): la pieza ya ocupa poco del canvas,
    // así que el costo de raymarching es bajo y merece la pena para que el
    // borde de la silueta no se vea pixelado/cortado.
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // Arrastrar (pointerdown + move) rota la cámara alrededor de la pieza,
    // igual que en el codepen original; al soltar, la rotación se queda donde
    // estaba (no hay "vuelta a cero").
    let dragging = false;
    let lastX = 0, lastY = 0;
    let moveX = 0, moveY = 0;

    const onPointerDown = (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
        if (!dragging) return;
        moveX += e.clientX - lastX;
        moveY += lastY - e.clientY;
        lastX = e.clientX;
        lastY = e.clientY;
    };
    const onPointerUp = (e) => {
        dragging = false;
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // La pieza gira con el scroll de la página (avanza mientras el hero está en
    // pantalla, los primeros 100vh, antes de que el vídeo lo cubra), suavizado
    // con inercia, MÁS un giro propio lento y constante (independiente del
    // scroll y del mouse) para que siempre haya movimiento visible, no solo al
    // interactuar. El balanceo de cámara (wob1/wob2 en el shader) suma encima.
    const ROTATION_RANGE = 5.5;
    const EASE = 0.08;
    const IDLE_SPIN_SPEED = 0.12; // rad/s de giro propio, lento y continuo
    let targetPhase = 0;
    let currentPhase = 0;

    function updateTargetPhase() {
        const vh = window.innerHeight || 1;
        const progress = Math.min(1, Math.max(0, window.scrollY / vh));
        targetPhase = progress * ROTATION_RANGE;
    }
    updateTargetPhase();
    currentPhase = targetPhase;

    window.addEventListener('scroll', updateTargetPhase, { passive: true });

    function resize() {
        const w = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        setupSceneTarget(canvas.width, canvas.height);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let rafId = null;
    function animate(now) {
        rafId = requestAnimationFrame(animate);
        currentPhase += (targetPhase - currentPhase) * EASE;
        const t = now * 1e-3;

        // Pasada 1: la escultura raymarcheada, renderizada a una textura.
        gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(scene.prog);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uPhase, currentPhase + t * IDLE_SPIN_SPEED);
        gl.uniform1f(uIdleTime, t);
        gl.uniform2f(uMove, moveX, moveY);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Pasada 2: difumina esa textura y la pinta en el canvas visible.
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(blur.prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.uniform1i(uBlurScene, 0);
        gl.uniform2f(uBlurResolution, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    rafId = requestAnimationFrame(animate);

    function dispose() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', updateTargetPhase);
        resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        gl.deleteBuffer(buffer);
        gl.deleteTexture(sceneTexture);
        gl.deleteFramebuffer(sceneFBO);
        gl.deleteProgram(scene.prog);
        gl.deleteShader(scene.vs);
        gl.deleteShader(scene.fs);
        gl.deleteProgram(blur.prog);
        gl.deleteShader(blur.vs);
        gl.deleteShader(blur.fs);
        canvas.remove();
    }

    return { dispose, resize };
}

/*
  Soft: the variable-focus image pipeline behind the home avatar.
  Ported from the ElevenLabs v4 hero (three.js there, raw WebGL1 here):
    source pass (rgb = picture, a = silhouette)
    → flow: pointer trail, fades by scaling from centre, curled by noise
    → blur field: base + trail + slow noise^3, in CSS px
    → separable 13-tap gaussian with per-pixel radius, two passes (1, .5)
    → composite: grain overlay on colour, mask = mix(sharp, blurred) overlaid with soft grain
  Output is premultiplied alpha over whatever is behind the canvas.
*/

export const GLSL_COMMON = `
  precision highp float; varying vec2 vUv;
  uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f); return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
  float fbm(vec2 p){ float v = 0., a = .5; mat2 rot = mat2(cos(.5), sin(.5), -sin(.5), cos(.5)); for (int i = 0; i < 4; i++){ v += a * noise(p); p = rot * p * 2. + 100.; a *= .5; } return v; }
`;

const VS = 'attribute vec2 a;varying vec2 vUv;void main(){vUv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';

const TAPS = [.0022, .0088, .0270, .0649, .1212, .1761, .1996, .1761, .1212, .0649, .0270, .0088, .0022]
  .map((w, i) => `s+=texture2D(uSrc,vUv+st*${(i - 6).toFixed(1)})*${w};`).join('');

const SHADERS = {
  flow: GLSL_COMMON + `uniform sampler2D uPrev; uniform vec2 uVelP; uniform float uAspect,uDiss,uScale,uCurl,uFalloff,uAlpha;
    void main(){ float vf=length(uVelP)*.5; vec2 uvm=(vUv-.5)/(uScale+vf*.02)+.5; vec3 cf=vec3(noise(vUv*3.),noise(vUv*3.+7.3),noise(vUv*3.+13.1))-.5; uvm+=cf.xy*cf.z*uCurl*vf;
      float prev=texture2D(uPrev,uvm).r*uDiss; vec2 cur=vUv-uMouse; cur.x*=uAspect; float sz=uFalloff*(.5+length(uVelP)*.5); float st=1.-pow(1.-min(1.,length(uVelP)),3.); float fo=smoothstep(sz,0.,length(cur))*uAlpha;
      gl_FragColor=vec4(min(prev+st*fo,1.),0.,0.,1.); }`,
  field: GLSL_COMMON + `uniform sampler2D uFlow; uniform float uBase,uTrail,uNoise,uNScale,uNSpeed,uSMin,uSMax,uAspect; uniform vec2 uWind;
    void main(){ float sp=texture2D(uFlow,vUv).r; vec2 p=vUv*vec2(uAspect,1.)*uNScale+uWind*uTime; float n=(noise(p)+noise(p*1.7+vec2(uTime*uNSpeed*2.,-uTime*uNSpeed)))*.5; n=smoothstep(uSMin,uSMax,n); n=n*n*n;
      float f=uBase+sp*uTrail+n*uNoise; gl_FragColor=vec4(f/64.,0.,0.,1.); }`,
  blur: `precision highp float; varying vec2 vUv; uniform sampler2D uSrc,uField; uniform vec2 uDir,uTexel; uniform float uScale;
    void main(){ float r=texture2D(uField,vUv).r*64.*uScale; vec2 st=uDir*r*uTexel; vec4 s=vec4(0.); ${TAPS} gl_FragColor=s; }`,
  comp: GLSL_COMMON + `uniform sampler2D uSharp,uBlur,uField; uniform float uGOp,uGScale,uEdge;
    float ov(float b,float s){ return b<.5?2.*b*s:1.-2.*(1.-b)*(1.-s); }
    void main(){ float amt=texture2D(uField,vUv).r*64.; float t=smoothstep(0.,.3,amt); vec4 sh=texture2D(uSharp,vUv), bl=texture2D(uBlur,vUv); vec3 col=mix(sh.rgb,bl.rgb,t);
      float g=hash12(floor(gl_FragCoord.xy/uGScale)); col=mix(col,vec3(ov(col.r,g),ov(col.g,g),ov(col.b,g)),uGOp);
      float m=mix(sh.a,bl.a,t); float gm=noise(gl_FragCoord.xy*.6); m=mix(m,ov(m,gm),uEdge); m=smoothstep(0.,.8,m);
      gl_FragColor=vec4(col*m,m); }`,
};

const DEFAULTS = {
  dpr: 1.5, flowDiv: 4,
  baseBlur: .15, trailBlur: 11, noiseBlur: 4.2, noiseScale: 2, noiseSpeed: .07, wind: [.025, .012], smoothMin: .42, smoothMax: .84,
  grain: .36, grainScale: 1, edgeGrain: .3,
  dissipation: .965, flowScale: 1.012, curl: .35, falloff: .22, stampAlpha: .6, passes: [1, .5],
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts  DEFAULTS plus `source` (fragment body with GLSL_COMMON available) and `onSource(uniforms, gl)`
 */
export function Soft(canvas, opts) {
  opts = Object.assign({}, DEFAULTS, opts || {});
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) return null;

  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
  const vs = compile(gl.VERTEX_SHADER, VS);
  const prog = (fs) => {
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const fbo = (w, h) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { t, f, w, h, bind: (id) => { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, t); return id; } };
  };
  const dbl = (w, h) => { let a = fbo(w, h), b = fbo(w, h); return { get r() { return a; }, get w() { return b; }, swap() { const t = a; a = b; b = t; } }; };

  const P = {}; for (const k in SHADERS) P[k] = prog(SHADERS[k]);
  const src = prog(GLSL_COMMON + opts.source);

  let W = 0, H = 0, flow, field, source, bA, bB;
  const alloc = () => { W = canvas.width; H = canvas.height; const fw = Math.max(48, Math.round(W / opts.flowDiv)), fh = Math.max(48, Math.round(H / opts.flowDiv)); flow = dbl(fw, fh); field = fbo(fw, fh); source = fbo(W, H); bA = fbo(W, H); bB = fbo(W, H); };
  const blit = (t) => { if (t) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.f); gl.viewport(0, 0, t.w, t.h); } else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); } gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  const resize = () => { const dpr = Math.min(opts.dpr, devicePixelRatio || 1); const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr); if (w && h && (w !== canvas.width || h !== canvas.height)) { canvas.width = w; canvas.height = h; alloc(); } };

  const S = { mouse: [-1, -1], vel: [0, 0] };
  let tm = [-1, -1], last = null, lastT = performance.now(), t0 = performance.now(), raf = 0, running = true;
  const onMove = (e) => { const r = canvas.getBoundingClientRect(); tm = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
  canvas.ownerDocument.addEventListener('pointermove', onMove);

  const common = (u, w, h) => { if (u.uRes) gl.uniform2f(u.uRes, w, h); if (u.uTime) gl.uniform1f(u.uTime, (performance.now() - t0) / 1000); if (u.uMouse) gl.uniform2f(u.uMouse, S.mouse[0], S.mouse[1]); };

  const frame = () => {
    if (!running) return;
    resize(); if (!source) alloc();
    const now = performance.now(), dt = Math.min(.05, (now - lastT) / 1000) || .016; lastT = now;
    if (tm[0] >= 0) {
      if (last) { const v = [(tm[0] - last[0]) / dt * .04, (tm[1] - last[1]) / dt * .04]; S.vel = [S.vel[0] + (v[0] - S.vel[0]) * .3, S.vel[1] + (v[1] - S.vel[1]) * .3]; }
      last = tm.slice();
      S.mouse = [S.mouse[0] < 0 ? tm[0] : S.mouse[0] + (tm[0] - S.mouse[0]) * .35, S.mouse[1] < 0 ? tm[1] : S.mouse[1] + (tm[1] - S.mouse[1]) * .35];
      S.vel = [S.vel[0] * .9, S.vel[1] * .9];
    }
    const asp = W / H; let u;
    gl.useProgram(src.p); common(src.u, W, H); if (opts.onSource) opts.onSource(src.u, gl); blit(source);
    u = P.flow.u; gl.useProgram(P.flow.p); common(u, flow.r.w, flow.r.h); gl.uniform1i(u.uPrev, flow.r.bind(0)); gl.uniform2f(u.uVelP, S.vel[0], S.vel[1]); gl.uniform1f(u.uAspect, asp); gl.uniform1f(u.uDiss, opts.dissipation); gl.uniform1f(u.uScale, opts.flowScale); gl.uniform1f(u.uCurl, opts.curl); gl.uniform1f(u.uFalloff, opts.falloff); gl.uniform1f(u.uAlpha, opts.stampAlpha); blit(flow.w); flow.swap();
    u = P.field.u; gl.useProgram(P.field.p); common(u, field.w, field.h); gl.uniform1i(u.uFlow, flow.r.bind(0)); gl.uniform1f(u.uBase, opts.baseBlur); gl.uniform1f(u.uTrail, opts.trailBlur); gl.uniform1f(u.uNoise, opts.noiseBlur); gl.uniform1f(u.uNScale, opts.noiseScale); gl.uniform1f(u.uNSpeed, opts.noiseSpeed); gl.uniform1f(u.uSMin, opts.smoothMin); gl.uniform1f(u.uSMax, opts.smoothMax); gl.uniform1f(u.uAspect, asp); gl.uniform2f(u.uWind, opts.wind[0], opts.wind[1]); blit(field);
    u = P.blur.u; gl.useProgram(P.blur.p); gl.uniform2f(u.uTexel, 1 / W, 1 / H); let from = source; const k = W / Math.max(1, canvas.clientWidth); // radii are CSS px
    for (const sc of opts.passes) { gl.uniform1f(u.uScale, sc * k); gl.uniform1i(u.uSrc, from.bind(0)); gl.uniform1i(u.uField, field.bind(1)); gl.uniform2f(u.uDir, 1, 0); blit(bA); gl.uniform1i(u.uSrc, bA.bind(0)); gl.uniform2f(u.uDir, 0, 1); blit(bB); from = bB; }
    u = P.comp.u; gl.useProgram(P.comp.p); common(u, W, H); gl.uniform1i(u.uSharp, source.bind(0)); gl.uniform1i(u.uBlur, bB.bind(1)); gl.uniform1i(u.uField, field.bind(2)); gl.uniform1f(u.uGOp, opts.grain); gl.uniform1f(u.uGScale, opts.grainScale); gl.uniform1f(u.uEdge, opts.edgeGrain); blit(null);
    raf = requestAnimationFrame(frame);
  };
  resize(); if (!source) alloc(); raf = requestAnimationFrame(frame);

  // pause when the tab is hidden; the sim is cheap but there is no reason to spin
  const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; lastT = performance.now(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', onVis);

  return { gl, opts, size: () => [W, H], destroy() { running = false; cancelAnimationFrame(raf); canvas.ownerDocument.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis); } };
}

/**
 * The home avatar: the photo inside a soft circle, run through Soft.
 * The circle spans 62% of the canvas; the photo fills the circle.
 * Returns null when WebGL is unavailable so the caller can keep the plain <img>.
 * @param {HTMLCanvasElement} canvas
 * @param {string} photoUrl
 */
export function focusAvatar(canvas, photoUrl) {
  let tex = null;
  const soft = Soft(canvas, {
    source: `uniform sampler2D uPhoto; void main(){ vec2 p=(vUv-.5)*2.; float r=length(p); float aa=3./uRes.y; float m=1.-smoothstep(.62-aa,.62+aa,r);
      vec2 w=(vUv-.5)/.62+.5; w+=(vec2(fbm(w*3.+uTime*.04),fbm(w*3.+5.3-uTime*.03))-.5)*.012;
      gl_FragColor=vec4(texture2D(uPhoto,w).rgb,m); }`,
    onSource: (u, gl) => { if (!tex) return; gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.uPhoto, 5); },
  });
  if (!soft) return null;
  const gl = soft.gl;
  tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([230, 230, 226, 255]));
  const img = new Image(); img.src = photoUrl;
  img.onload = () => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); };
  return soft;
}

/* fx / background-shader — WebGL plasma + aurora + god-rays background (domain-warped fbm, perspective grid, motes, pulse ripples).
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Needs in the DOM: <canvas id="fx-bg"> (position:fixed, see component.css) and optionally <div id="fx-bgf"> (css fallback layer).
 * JEV.* used: mod, $, clamp, reduce, watch(el, cb), task(el, fn), pointer, bus ('kill' bool, 'decision' d.dest, 'tick' {price}, 'tint', 'tier'), S.killed, tint, tier, bootLog (optional).
 * Provides: JEV.pulse(strength 0..1) - ripple from the viewport centre.
 * Data: price ticks drive "heat" (|bps| of last tick), decision.dest drives flash (execute) / amber ripple (review) / dim (skip). Swap in real data by emitting the same bus events. */
JEV.mod('fx-background-shader', () => {
  const J = JEV, doc = document, root = doc.documentElement;
  const $ = J.$, clamp = J.clamp, reduce = J.reduce;
  let winW = window.innerWidth, winH = window.innerHeight, scrollY = window.scrollY || 0, scrollMax = 1, away = false, vel = 0;
  let bgPost = null; // set once the plasma (worker or main thread) is alive: bgPost(message)

  /** kick the shader ripple (ring from the viewport centre) */
  J.pulse = (s) => {
    s = clamp(s == null ? 0.5 : +s || 0, 0, 1);
    if (s <= 0) return;
    if (bgPost) bgPost({ t: 'p', s });
  };

  const bg = $('#fx-bg');
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes,uPtr,uLt;uniform float uSc,uT,uKill,uScroll,uProg,uPA,uVel,uHeat,uDir,uFlash,uDim,uIn,uTA;uniform vec3 uPu[3],uTint;',
    'const float CAP=.0049;', // linear-luminance ceiling of the plasma: keeps 12px grey text >= 4.5:1 anywhere
    'const mat2 ROT=mat2(.8,-.6,.6,.8);const vec3 LW=vec3(.2126,.7152,.0722);',
    'vec3 hue(vec3 c){return c/dot(c,LW);}',
    'float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}',
    'float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1.,0.)),f.x),mix(h12(i+vec2(0.,1.)),h12(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<OCT;i++){v+=a*vn(p);p=ROT*p*2.02+17.3;a*=.5;}return v;}',
    'float ring(float d,vec3 u){float r=u.x*.62,w=.03+u.x*.045,x=(d-r)/w;return u.y*exp(-x*x)*exp(-u.x*1.4);}',
    'void main(){',
    ' vec2 fc=gl_FragCoord.xy,uv=fc/uRes;float asp=uRes.x/uRes.y;vec2 p=(uv-.5)*vec2(asp,1.)*(1.+.2*uIn*uIn);', // intro: camera push (features start small, settle)
    ' float d0=length(p);float q0=ring(d0,uPu[0]),q1=ring(d0,uPu[1]),q2=ring(d0,uPu[2]);float rg=q0+q1+q2;float rgA=(q0*uPu[0].z+q1*uPu[1].z+q2*uPu[2].z)/max(rg,.001);',
    ' vec2 pw=p+(p/(d0+.001))*rg*.06;', // ripple refracts the plasma
    ' float t=uT;vec2 q=pw*1.7+vec2(0.,uScroll*.00024);',
    ' vec2 w=vec2(fbm(q+vec2(0.,t*.05)),fbm(q+vec2(5.2,1.3)+vec2(-t*.04,t*.012)));',
    ' float f=fbm(q*1.15+2.9*(w-.5)+vec2(t*.03,-t*.021));',
    ' float k=uKill;',
    // palette at unit luminance, so every layer below has an explicit luminance budget (linear light)
    ' vec3 hInd=hue(mix(vec3(.03,.05,.60),vec3(.55,.03,.02),k));',
    ' vec3 hVio=hue(mix(vec3(.30,.02,.80),vec3(.95,.30,.012),k));',
    ' vec3 hMag=hue(mix(mix(vec3(1.,.025,.28),max(uTint,vec3(.02)),uTA*.75),vec3(1.,.08,.04),k));',
    ' float hf=clamp(smoothstep(.26,.74,.55*f+.45*w.y+.14*sin(uProg*6.2832))+uDir*uHeat*.12,0.,1.);', // hue field: indigo -> violet -> magenta, drifts with plasma + page progress
    ' vec3 hc=mix(mix(hInd,hVio,clamp(hf*2.,0.,1.)),hMag,clamp(hf*2.-1.,0.,1.));',
    ' float a1=smoothstep(.30,.78,f);float a2=smoothstep(.42,.82,.5*(w.x+w.y)+.4*(f-.45));',
    ' float r1=pow(1.-abs(2.*f-1.),6.)*smoothstep(.28,.66,f);float r2=pow(1.-abs(2.*w.x-1.),8.)*smoothstep(.3,.7,w.y);', // aurora filaments (iso-contours of the noise)
    ' float ray=pow(.5+.5*sin(pw.x*9.+w.y*6.5+t*.12),6.)*smoothstep(.15,.95,uv.y)*smoothstep(.3,.72,f);', // slow vertical curtains, strongest toward the top
    ' vec3 col=vec3(.0011,.0006,.0022);',
    ' col+=hc*(a1*.00065+a2*.0004);',
    ' col+=mix(hVio,hMag,.6)*(r1*.0012+r2*.0005);',
    ' col+=hInd*ray*.0008;',
    // moving light source above the frame: volumetric shafts (angular value noise, occluded by the plasma) + core glow
    ' vec2 lp=vec2(uLt.x*asp*.5,uLt.y);vec2 ld=p-lp;float lr=length(ld);float ang=atan(ld.x+.0001,-ld.y);',
    ' float sh=vn(vec2(ang*9.+t*.04,t*.07));',
    '#if TIER>=2',
    ' sh=sh*.6+.4*vn(vec2(ang*23.-t*.06,3.1+t*.05));',
    '#endif',
    ' sh=pow(smoothstep(.4,.88,sh),2.6)*(.45+1.0*f);',
    ' float fall=exp(-lr*1.1)*smoothstep(0.,.22,lr);',
    ' col+=mix(hVio,hMag,.35+.3*sh)*(sh*fall*.0120+exp(-lr*lr*9.)*.0034)*(1.+uHeat*.9);',
    // faint perspective grid under a horizon: lines recede toward the vanishing point, a bright band rolls toward the horizon
    ' float gd=.3-uv.y;float gz=.05/max(gd,.004);float gxl=(uv.x-.5)*gz*7.;float gzl=gz+t*(.32+.5*uHeat);',
    ' float gw=.012+.012*gz;float gl=max(1.-smoothstep(0.,gw,abs(fract(gxl)-.5)),1.-smoothstep(0.,gw,abs(fract(gzl)-.5)));',
    ' float gv=step(0.,gd)*smoothstep(0.,.05,gd)*exp(-gd*4.2);',
    ' float gband=exp(-pow((fract(gz*.22-t*.16)-.5)*7.,2.));',
    ' vec3 gcol=mix(hVio,hMag,.5)*(gl*gv*(.0012+gband*.0034)*(1.+uHeat)+exp(-pow((uv.y-.3)/.006,2.))*.0030*(.6+.4*sin(t*.9)));col+=mix(hVio,hMag,.5)*exp(-pow((uv.y-.3)/.1,2.))*.0010;',
    '#if TIER>=2',
    // parallax aurora ribbons (own scroll rates), soft bloom bands, slow full-width scanline
    ' for(int Ri=0;Ri<RIB;Ri++){float fi=float(Ri);float xw=p.x*(1.1+.45*fi)+t*(.03+.012*fi);',
    '  float yc=.5+.17*fi+.09*sin(xw*2.1+fi*1.7+w.x*2.)+.05*sin(xw*4.7-t*.2)+uScroll*.00004*(1.+fi);',
    '  float cu=.45+.55*vn(vec2(p.x*(12.+fi*4.)+fi*5.,t*.1));',
    '  col+=mix(mix(hInd,hVio,fi*.5),hMag,.2+.25*fi)*exp(-pow((uv.y-yc)/(.028+.018*fi),2.))*cu*(.0046-.0010*fi)*(1.+uHeat*.7);}',
    ' col+=hc*exp(-pow((uv.y-(.55+.3*sin(t*.045)))*2.6,2.))*.0010*(.6+uHeat);',
    ' col+=hMag*exp(-pow((fract(uv.y*.5-t*.025)-.5)*30.,2.))*.0007;',
    '#endif',
    ' col*=(1.+uHeat*.25)*(1.-.3*uDim);',
    ' float side=smoothstep(.15,.95,abs(p.x)/(asp*.5));float wide=smoothstep(1.25,1.9,asp);', // calmer behind the centre column on wide screens
    ' col*=mix(1.,mix(.55,1.15,side),wide);',
    // faint horizontal data bands: dashed hairline + soft fill, sliding segments (css-px space)
    ' vec2 cp=fc/uSc;float row=floor(cp.y/34.);float rs=h11(row*1.37+3.1);float on=step(.78,rs);',
    ' float spd=(h11(row+7.7)-.5)*.05;float bx=fract(rs*13.7+t*spd);float seg=.10+.5*h11(row+1.9);float u=fract(uv.x-bx);',
    ' float inSeg=smoothstep(0.,.015,u)*(1.-smoothstep(seg,seg+.02,u));',
    ' float my=mod(cp.y,34.);float line=(1.-smoothstep(0.,1.3,abs(my-1.5)*uSc))*(.5+.5*step(.5,fract((cp.x+row*19.)/14.)));',
    ' col+=mix(hVio,hMag,hf)*on*inSeg*(line*.0016+.0005*(1.-smoothstep(0.,30.,my)));',
    // killed: slow red sweep
    ' float sw=exp(-pow((fract(uv.y*.9-t*.16)-.5)*8.,2.));col+=vec3(.9,.04,.02)*sw*k*.003;',
    ' float sb=pow(max(0.,cos(ang-t*1.05)),20.)*exp(-lr*.6)+pow(max(0.,cos(ang-t*1.05+3.1416)),20.)*exp(-lr*.9)*.5;col+=vec3(.95,.03,.02)*sb*k*(.006+.002*sin(t*3.));',
    // soft luminance limiter
    ' float L=dot(col,LW);col*=1./pow(1.+pow(L/CAP,3.),1./3.);',
    // vignette baked in (plasma only, never over text): dark corners, red-hot edges while killed
    ' float vg=smoothstep(.5+.035*sin(t*.45+uHeat*2.),1.12,length(p*vec2(.86,1.)));col*=1.-.7*vg;col+=gcol*(1.-.6*vg);col+=vec3(.9,.02,.03)*k*vg*.0011;',
    // edge dispersion: cyan fringe left, magenta fringe right, swelling with scroll velocity (added after the vignette: a few % of the text-contrast budget)
    ' float ex=p.x/(asp*.5);col+=mix(vec3(.04,.5,.9),vec3(.9,.05,.22),step(0.,ex))*smoothstep(.55,1.05,abs(ex))*(.0004+.0012*uVel+.004*uIn)*(1.-.5*k);',
    ' col+=vec3(1.,.5,.8)*pow(h11(floor(atan(p.x,p.y)*40.)),6.)*smoothstep(.1,.7,d0)*uIn*.004;', // intro: zoom-blur streaks
    ' col+=mix(vec3(1.,.5,.18),vec3(1.,.1,.05),k)*uFlash*exp(-lr*.9)*.0035;', // execute: warm flash from the light
    // drifting data motes: two parallax layers of tiny twinkling points (full-quality path only; points are far too small to touch text contrast)
    '#ifdef MOTES',
    ' float mo=0.;',
    ' for(int Ly=0;Ly<2;Ly++){float sc=Ly==0?64.:104.;vec2 g=vec2(cp.x,cp.y-t*(Ly==0?3.2:5.4))/sc;vec2 id=floor(g),f=fract(g)-.5;float hh=h12(id+float(Ly)*17.);',
    '  vec2 of=(vec2(h12(id+3.1),h12(id+7.7))-.5)*.62;float dd=length(f-of)*sc;float tw=.5+.5*sin(t*(.8+hh*2.2)+hh*40.);',
    '  mo+=step(.74,hh)*(1.-smoothstep(.6,3.1,dd))*(.35+.65*tw)*(Ly==0?1.:.6);}',
    ' col+=mix(hVio,hMag,hf)*mo*.0062*(.4+.6*smoothstep(0.,.5,a1+a2));',
    '#endif',
    // pointer glow + ripple light (added after the limiter, small bounded budget)
    ' vec2 pp=(uPtr-.5)*vec2(asp,1.);float dg=length(p-pp);float g=exp(-dg*dg*60.)*.8+exp(-dg*dg*7.)*.2;',
    ' col+=mix(vec3(.9,.03,.22),vec3(1.,.12,.03),k)*g*uPA*.0065;',
    ' col+=mix(mix(vec3(.9,.1,.5),vec3(1.,.4,.05),k),vec3(1.,.55,.04),rgA)*min(rg,1.3)*.0125;',
    '#if TIER>=2',
    ' float Lx=dot(col,LW);col+=vec3(1.,.22,.1)*smoothstep(.5,1.,Lx/CAP)*.0006;', // halation: red bleed around the brightest plasma
    '#endif',
    ' col=pow(col,vec3(.4545));col+=(h12(fc+fract(t*7.3)*91.7)-.5)*(.0075+.004*dot(col,LW));', // gamma + dither/grain
    ' gl_FragColor=vec4(col,1.);}',
  ].join('\n');

  /* renderer + simulation. SELF-CONTAINED (no closure access): its source is shipped into the worker via toString().
   * messages: Float32Array[nx, ny, idle, away, scroll, prog, vel] · {t:'k',v} kill · {t:'p',s} pulse · {t:'r',w,h} css size */
  function createBg(canvas, VS, FS, o) {
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const S = { T: 11.7, kill: o.killed ? 1 : 0, killT: o.killed ? 1 : 0, tier: o.tier || 0, fixed: !!o.tier, heat: 0, heatT: 0, dir: 0, dirT: 0, flash: 0, dim: 0, intro: 0, tint: [0, 0, 0], ta: 0, lx: 0, ly: 0.62, sx: 0.5, sy: 0.55, pa: 0.5, vel: 0, nx: 0.5, ny: 0.5, idle: 1, away: 0, scroll: 0, prog: 0, cw: o.w, ch: o.h, qual: 1, reduce: !!o.reduce };
    const P = [{ a: 9, s: 0, k: 0 }, { a: 9, s: 0, k: 0 }, { a: 9, s: 0, k: 0 }], pu = new Float32Array(9), tt = new Float32Array(3);
    let pi = 0, gl = null, U = null, soft = false, pr = null, built = 0, info = '', warm = 0, gAcc = 0, gN = 0;
    const cb = o.cb || function () {};

    function init() {
      const t0 = performance.now();
      let g = null;
      try {
        const ob = { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false };
        g = canvas.getContext('webgl', ob) || canvas.getContext('experimental-webgl', ob);
      } catch (e) { g = null; }
      if (!g) return false;
      const t1 = performance.now();
      try { // software rasteriser (swiftshader / llvmpipe): start small, cheaper noise, lower frame rate
        const dbg = g.getExtension('WEBGL_debug_renderer_info');
        soft = /swiftshader|llvmpipe|software|basic render/i.test(String(dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''));
      } catch (e) { soft = false; }
      pr = null; gl = g;
      if (!S.tier) S.tier = soft ? 1 : 2; // core's tier wins when it exists; otherwise software rasterisers start cheap
      if (soft) S.qual = 0.6;
      if (!build()) { gl = null; return false; }
      return true;
    }
    function build() { // (re)compile the program for the current tier; keeps the old one when it fails
      const g = gl, t2 = performance.now(), T = S.tier;
      const mk = (type, src) => { const sh = g.createShader(type); g.shaderSource(sh, src); g.compileShader(sh); return g.getShaderParameter(sh, g.COMPILE_STATUS) ? sh : null; };
      const vs = mk(g.VERTEX_SHADER, VS), fs = mk(g.FRAGMENT_SHADER, '#define OCT ' + (T >= 3 ? 4 : T === 2 ? 4 : 3) + '\n#define TIER ' + T + '\n#define RIB ' + (T >= 3 ? 3 : 2) + '\n' + (T >= 3 ? '#define MOTES\n' : '') + FS);
      if (!vs || !fs) return false;
      const p2 = g.createProgram(); g.attachShader(p2, vs); g.attachShader(p2, fs); g.linkProgram(p2);
      if (!g.getProgramParameter(p2, g.LINK_STATUS)) return false;
      g.useProgram(p2);
      g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
      const al = g.getAttribLocation(p2, 'a'); g.enableVertexAttribArray(al); g.vertexAttribPointer(al, 2, g.FLOAT, false, 0, 0);
      const u = {};
      ['uRes', 'uPtr', 'uSc', 'uT', 'uKill', 'uScroll', 'uProg', 'uPA', 'uVel', 'uLt', 'uHeat', 'uDir', 'uFlash', 'uDim', 'uIn', 'uTA', 'uTint'].forEach((n) => (u[n] = g.getUniformLocation(p2, n)));
      u.uPu = g.getUniformLocation(p2, 'uPu[0]');
      if (pr) g.deleteProgram(pr);
      pr = p2; U = u; built = T;
      info = (soft ? 'software' : 'hw') + ' tier ' + T + ' compile+link ' + (performance.now() - t2).toFixed(0) + 'ms';
      return true;
    }
    function size() {
      if (!gl) return;
      const rs = S.tier >= 3 ? 0.6 : S.tier === 2 ? 0.5 : 0.35, base = Math.min(rs, Math.sqrt((S.tier >= 3 ? 720000 : 520000) / Math.max(1, S.cw * S.ch))); // tier 1/2/3 = 0.35x / 0.5x / 0.6x, and <= ~0.5-0.7 MP on huge screens
      const w = Math.max(16, Math.round(S.cw * base * S.qual)), h = Math.max(16, Math.round(S.ch * base * S.qual));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      draw();
    }
    function draw() {
      if (!gl) return;
      for (let i = 0; i < 3; i++) { pu[i * 3] = P[i].a; pu[i * 3 + 1] = P[i].s; pu[i * 3 + 2] = P[i].k; }
      tt[0] = S.tint[0]; tt[1] = S.tint[1]; tt[2] = S.tint[2];
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform2f(U.uPtr, S.sx, S.sy);
      gl.uniform1f(U.uSc, canvas.width / S.cw);
      gl.uniform1f(U.uT, S.T);
      gl.uniform1f(U.uKill, S.kill);
      gl.uniform1f(U.uScroll, S.scroll);
      gl.uniform1f(U.uProg, S.prog);
      gl.uniform1f(U.uPA, S.pa);
      gl.uniform1f(U.uVel, S.vel);
      gl.uniform3fv(U.uPu, pu);
      gl.uniform2f(U.uLt, S.lx, S.ly);
      gl.uniform1f(U.uHeat, S.heat); gl.uniform1f(U.uDir, S.dir); gl.uniform1f(U.uFlash, S.flash); gl.uniform1f(U.uDim, S.dim);
      gl.uniform1f(U.uIn, S.intro); gl.uniform1f(U.uTA, S.ta); gl.uniform3fv(U.uTint, tt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function step(dt) {
      if (!S.reduce) S.T += dt;
      S.kill += (S.killT - S.kill) * (1 - Math.exp(-dt * 3.2));
      if (Math.abs(S.killT - S.kill) < 0.002) S.kill = S.killT;
      let tx, ty, ta;
      if (S.idle) { tx = 0.5 + 0.3 * Math.sin(S.T * 0.21); ty = 0.55 - 0.25 * Math.sin(S.T * 0.17 + 1.3); ta = 0.5; } // no pointer yet: an ambient light wanders
      else { tx = S.nx; ty = S.ny; ta = S.away ? 0.35 : 1; }
      const k = 1 - Math.exp(-dt * 5); S.sx += (tx - S.sx) * k; S.sy += (ty - S.sy) * k; S.pa += (ta - S.pa) * k;
      for (let i = 0; i < 3; i++) { const p = P[i]; if (p.s > 0) { p.a += dt; if (p.a > 3) p.s = 0; } }
      if (S.reduce) { S.heat = S.flash = S.dim = S.intro = 0; S.lx = 0.1; return; } // reduced motion: calm, static atmosphere
      const kh = 1 - Math.exp(-dt * 2.5);
      S.heat += (S.heatT - S.heat) * kh; S.heatT *= Math.exp(-dt * 0.6); S.dir += (S.dirT - S.dir) * kh;
      S.flash *= Math.exp(-dt * 3.2); S.dim *= Math.exp(-dt * 1.6);
      if (S.intro > 0) S.intro = Math.max(0, S.intro - dt / 1.35);
      S.ta += ((S.tint[0] + S.tint[1] + S.tint[2] > 0 ? 1 : 0) - S.ta) * (1 - Math.exp(-dt * 2));
      // the light drifts above the frame; while killed it parks at top-centre and a siren beam sweeps from it
      const kk = S.kill;
      S.lx = (Math.sin(S.T * 0.07) * 0.7 + 0.25 * Math.sin(S.T * 0.173)) * (1 - kk); S.ly = 0.62 + 0.05 * Math.sin(S.T * 0.11) - 0.04 * kk;
    }
    function once() { step(0.016); draw(); }
    const api = {
      ok: false,
      get soft() { return soft; },
      get info() { return info; },
      get minDt() { return S.qual < 0.7 ? 0.045 : 0.028; }, // plasma is slow and soft: ~30 fps (20 on weak gpus) is plenty
      tick(dt) {
        step(dt); draw();
        // resolution governor: if the plasma itself cannot keep ~24 fps, drop its resolution (floor 0.4 x)
        if (!S.reduce && ++warm > 60) { gAcc += dt; if (++gN >= 60) { if (gAcc / gN > 0.05) { if (S.qual > 0.4) { S.qual = Math.max(0.4, S.qual * 0.85); size(); } else if (!S.fixed && S.tier > 1) { S.tier--; build(); size(); } } gAcc = gN = 0; } }
      },
      msg(m) {
        if (m instanceof Float32Array) { S.nx = m[0]; S.ny = m[1]; S.idle = m[2]; S.away = m[3]; S.scroll = m[4]; S.prog = m[5]; S.vel = m[6] || 0; return; }
        if (m.t === 'k') { S.killT = m.v ? 1 : 0; if (S.reduce) { S.kill = S.killT; once(); } }
        else if (m.t === 'p') { const p = P[pi]; p.a = 0; p.s = m.s; p.k = m.k || 0; pi = (pi + 1) % 3; if (S.reduce) once(); }
        else if (m.t === 'x') { if (m.k === 1) S.flash = 1; else if (m.k === 2) S.dim = 1; } // 1 execute flash · 2 skip dim
        else if (m.t === 'h') { S.heatT = Math.max(S.heatT, m.v); S.dirT = m.d; }
        else if (m.t === 'c') { S.tint[0] = m.c[0]; S.tint[1] = m.c[1]; S.tint[2] = m.c[2]; }
        else if (m.t === 'i') { if (!S.reduce) S.intro = 1; }
        else if (m.t === 'q') { if (m.v !== S.tier && m.v >= 1 && m.v <= 3) { S.tier = m.v; S.fixed = true; if (gl && build()) size(); } }
        else if (m.t === 'r') { S.cw = m.w; S.ch = m.h; size(); }
      },
    };
    api.ok = init();
    if (api.ok) {
      size();
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); gl = null; cb('lost'); });
      canvas.addEventListener('webglcontextrestored', () => { if (init()) { size(); cb('ready'); } });
    }
    return api;
  }

  /* worker side: autonomous render loop (generation token so pause/resume can never double the loop) */
  function bgWorkerMain() {
    let inst = null, running = false, gen = 0, acc = 0, n = 0, reduce = false, last = 0;
    const raf = self.requestAnimationFrame ? (f) => self.requestAnimationFrame(f) : (f) => setTimeout(() => f(performance.now()), 33);
    function start() {
      if (running || !inst) return;
      running = true; last = performance.now(); const g = ++gen;
      const f = (now) => {
        if (!running || g !== gen) return;
        raf(f);
        const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; acc += dt;
        if (acc < inst.minDt) return;
        const d = acc; acc = 0; inst.tick(d);
        if (reduce && ++n >= 3) running = false; // reduced motion: a few frames, then still
      };
      raf(f);
    }
    self.onmessage = (e) => {
      const m = e.data;
      if (m.t === 'init') {
        reduce = !!m.reduce;
        inst = createBg(m.c, m.vs, m.fs, Object.assign(m, { cb: (t) => self.postMessage({ t }) }));
        self.postMessage({ t: inst.ok ? 'ready' : 'fail', info: inst.info });
        if (inst.ok) start();
      } else if (m.t === 'v') { if (m.h) running = false; else start(); }
      else if (inst) inst.msg(m);
    };
    self.postMessage({ t: 'hi' });
  }

  const note = (m) => { (J.bootLog || (J.bootLog = [])).push(m); };
  let bgMode = '';

  /* main-thread wiring shared by both paths: css size -> bg, pointer/scroll state -> bg (only when it changed) */
  function wireBg(post, drive) {
    bgPost = post; root.classList.add('fx-gl');
    J.watch(bg, (r) => { winW = Math.max(1, Math.round(r.width)); winH = Math.max(1, Math.round(r.height)); post({ t: 'r', w: winW, h: winH }); });
    const st = new Float32Array(7), last = new Float32Array(7).fill(-9);
    let acc = 0;
    J.task(bg, (t, dt) => {
      if (doc.hidden) return;
      const p = J.pointer, idle = p.x < -1000 ? 1 : 0;
      st[0] = idle ? 0.5 : p.x / winW; st[1] = idle ? 0.5 : 1 - p.y / winH; st[2] = idle; st[3] = away ? 1 : 0; st[4] = scrollY; st[5] = clamp(scrollY / scrollMax, 0, 1);
      vel = vel > 0.004 ? vel * Math.exp(-dt * 3.2) : 0; st[6] = Math.round(vel * 50) / 50;
      if (Math.abs(st[0] - last[0]) + Math.abs(st[1] - last[1]) > 0.0004 || st[2] !== last[2] || st[3] !== last[3] || Math.abs(st[4] - last[4]) > 0.5 || Math.abs(st[5] - last[5]) > 0.0005 || st[6] !== last[6]) { last.set(st); post(st); }
      if (drive) { acc += dt; if (acc >= drive.minDt || J.reduce) { drive.tick(J.reduce ? 0.016 : acc); acc = 0; } }
    });
  }
  function startMain() { // fallback: same renderer on the main thread
    if (bgMode) return; bgMode = 'main';
    const inst = createBg(bg, VS, FS, { w: winW, h: winH, reduce, killed: J.S.killed, tier: J.tier | 0, cb: (t) => { if (t === 'lost') root.classList.add('fx-nogl'); else root.classList.remove('fx-nogl'); } });
    if (!inst.ok) { root.classList.add('fx-nogl'); return; }
    note('fx-gl main-thread ' + inst.info);
    wireBg((m) => inst.msg(m), inst);
  }
  function startWorker() {
    let wk = null, url = '', transferred = false, done = false, to = 0;
    const toMain = () => { if (done) return; done = true; clearTimeout(to); try { wk && wk.terminate(); } catch (e) { /* ignore */ } if (transferred) root.classList.add('fx-nogl'); else fallbackMain(); };
    try {
      const src = 'const createBg=' + createBg.toString() + ';(' + bgWorkerMain.toString() + ')();';
      url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      wk = new Worker(url);
    } catch (e) { fallbackMain(); return; }
    to = setTimeout(toMain, 4000); // the worker never said hello
    wk.onerror = toMain;
    wk.onmessage = (e) => {
      const m = e.data;
      if (m.t === 'hi') {
        clearTimeout(to); try { URL.revokeObjectURL(url); } catch (err) { /* ignore */ }
        try {
          const off = bg.transferControlToOffscreen(); transferred = true;
          wk.postMessage({ t: 'init', c: off, vs: VS, fs: FS, w: winW, h: winH, reduce, killed: J.S.killed, tier: J.tier | 0 }, [off]);
          bgPost = (msg) => wk.postMessage(msg); // messages queue behind init, so a kill thrown while the context is still warming up is never lost
        } catch (err) { toMain(); }
      } else if (m.t === 'ready') {
        if (bgMode === 'worker') { root.classList.remove('fx-nogl'); return; } // context restored
        bgMode = 'worker'; note('fx-gl worker ' + m.info);
        wireBg((msg) => wk.postMessage(msg), null);
        doc.addEventListener('visibilitychange', () => wk.postMessage({ t: 'v', h: doc.hidden }));
      } else if (m.t === 'fail') { root.classList.add('fx-nogl'); done = true; wk.terminate(); }
      else if (m.t === 'lost') root.classList.add('fx-nogl');
    };
  }
  const fallbackMain = () => requestAnimationFrame(() => setTimeout(startMain, 0));
  if (bg) {
    const canWorker = typeof Worker === 'function' && typeof OffscreenCanvas === 'function' && typeof Blob === 'function' && !!bg.transferControlToOffscreen && !!window.URL && !!URL.createObjectURL;
    if (canWorker) requestAnimationFrame(() => setTimeout(startWorker, 0)); else fallbackMain();
  }
  root.addEventListener('mouseleave', () => (away = true));
  root.addEventListener('mouseenter', () => (away = false));

  /* scroll bookkeeping (the demo page may be taller than the viewport once embedded) */
  window.addEventListener('scroll', () => { const y = window.scrollY || 0; if (!reduce) vel = Math.max(vel * 0.7, clamp(Math.abs(y - scrollY) / 20 / 2.4, 0, 1)); scrollY = y; }, { passive: true });
  const measure = () => { winW = window.innerWidth; winH = window.innerHeight; scrollMax = Math.max(1, root.scrollHeight - winH); };
  window.addEventListener('resize', measure, { passive: true }); setTimeout(measure, 600);

  J.bus.on('kill', (on) => {
    if (bgPost) bgPost({ t: 'k', v: on });
    if (on) {
      J.pulse(1);
    } else {
      J.pulse(0.6);
    }
  });
  /* the atmosphere listens to the desk: execute = warm flash from the light, review = amber ripple, skip = dim; ticks drive intensity */
  J.bus.on('decision', (d) => {
    if (!d || doc.hidden) return;
    if (d.dest === 'execute') { J.pulse(0.35); if (bgPost) bgPost({ t: 'x', k: 1 }); }
    else if (d.dest === 'review') { if (bgPost) bgPost({ t: 'p', s: 0.5, k: 1 }); }
    else if (bgPost) bgPost({ t: 'x', k: 2 });
  });
  let lastPx = 0;
  J.bus.on('tick', (m) => {
    if (!m || !bgPost || doc.hidden || reduce) return;
    const px = m.price; if (!lastPx) lastPx = px;
    const bps = (px - lastPx) / lastPx * 1e4; lastPx = px;
    bgPost({ t: 'h', v: clamp(Math.abs(bps) / 3, 0, 1), d: clamp(bps / 3, -1, 1) });
  });
  /* tint (core may provide JEV.tint as '#rrggbb' | [r,g,b] | {r,g,b}) and quality tier (JEV.tier / html[data-tier]); both guarded */
  const tv = [-9, -9, -9];
  let tierSeen = J.tier | 0;
  function parseTint(v) {
    if (!v) return null;
    if (typeof v === 'string') { const m = /^#?([0-9a-f]{6})$/i.exec(v.trim()); return m ? [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16) / 255) : null; }
    const a = Array.isArray(v) ? v : [v.r, v.g, v.b]; if (!(a[0] >= 0 && a[1] >= 0 && a[2] >= 0)) return null;
    const sc = Math.max(a[0], a[1], a[2]) > 1 ? 255 : 1; return [a[0] / sc, a[1] / sc, a[2] / sc];
  }
  function syncEnv() {
    if (!bgPost) return;
    const tn = J.tint, a0 = tn ? tn[0] : -1, a1 = tn ? tn[1] : -1, a2 = tn ? tn[2] : -1; // core eases J.tint in place: compare values, not the reference
    if (Math.abs(a0 - tv[0]) + Math.abs(a1 - tv[1]) + Math.abs(a2 - tv[2]) > 2) { tv[0] = a0; tv[1] = a1; tv[2] = a2; const c = parseTint(tn); bgPost({ t: 'c', c: c || [0, 0, 0] }); }
    const q = J.tier | 0; if (q && q !== tierSeen) { tierSeen = q; bgPost({ t: 'q', v: q }); }
  }
  setInterval(() => { if (!doc.hidden) syncEnv(); }, 300);
  J.bus.on('tint', () => syncEnv());
  J.bus.on('tint', () => syncEnv());
  J.bus.on('tier', () => syncEnv());


  /* demo buttons (optional DOM: nothing throws when they are absent) */
  const on = (id, fn) => { const b = doc.getElementById(id); if (b) b.addEventListener('click', fn); };
  on('fxdPulse', () => J.pulse(0.9));
  on('fxdExec', () => J.fire());
  on('fxdKill', () => { J.setKilled(!J.S.killed); const b = doc.getElementById('fxdKill'); if (b) b.setAttribute('aria-pressed', String(J.S.killed)); });
});

(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* Canvas look: WebGL backdrop, cursor ring, section wipes, title parallax. Cosmetic only; the page works without it. */
  function build() {
    var cv = document.createElement('canvas');
    cv.id = 'cGl'; cv.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(cv, document.body.firstChild);
    var gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    var mx = .5, my = .5, tmx = .5, tmy = .5;
    if (gl) {
      root.classList.add('c-gl');
      var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      var fs = 'precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;' +
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
        'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}' +
        'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p*=2.;a*=.5;}return s;}' +
        'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=uv*vec2(r.x/r.y,1.)*1.7;float tt=t*.05;' +
        'vec2 w=vec2(fbm(q+tt),fbm(q+vec2(5.2,1.3)-tt));float f=fbm(q+2.*w+(m-.5)*.7);' +
        'vec3 col=mix(vec3(.015,.03,.05),vec3(.04,.32,.38),smoothstep(.3,.8,f));' +
        'col=mix(col,vec3(.32,.18,.66),smoothstep(.45,.95,w.x)*.5);' +
        'col+=vec3(1.,.55,.2)*pow(max(0.,1.-distance(uv,m)*1.8),3.)*.3;' +
        'col*=smoothstep(1.4,.15,distance(uv,vec2(.5)));gl_FragColor=vec4(col,1.);}';
      var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      var pg = gl.createProgram();
      gl.attachShader(pg, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(pg); gl.useProgram(pg);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uR = gl.getUniformLocation(pg, 'r'), uT = gl.getUniformLocation(pg, 't'), uM = gl.getUniformLocation(pg, 'm');
      var resize = function () { cv.width = Math.max(2, Math.round(innerWidth * .5)); cv.height = Math.max(2, Math.round(innerHeight * .5)); gl.viewport(0, 0, cv.width, cv.height); };
      resize(); window.addEventListener('resize', function () { resize(); draw(0); });
      var draw = function (t) { gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, t); gl.uniform2f(uM, mx, my); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
      window.addEventListener('pointermove', function (e) { tmx = e.clientX / innerWidth; tmy = 1 - e.clientY / innerHeight; }, { passive: true });
      if (reduce) draw(3); else (function loop(ts) {
        mx += (tmx - mx) * .05; my += (tmy - my) * .05;
        if (!document.hidden) draw(ts / 1000);
        requestAnimationFrame(loop);
      })(0);
    }

    if (fine) {
      var ring = document.createElement('div');
      ring.id = 'cCursor'; ring.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ring);
      var cx = -100, cy = -100, ctx = -100, cty = -100;
      window.addEventListener('pointermove', function (e) { ctx = e.clientX; cty = e.clientY; }, { passive: true });
      document.addEventListener('mouseover', function (e) { ring.classList.toggle('hot', !!e.target.closest('a,button,select,input,.toggle,.zoom')); });
      document.addEventListener('mouseleave', function () { ring.style.opacity = 0; });
      document.addEventListener('mouseenter', function () { ring.style.opacity = ''; });
      (function tick() {
        cx += (ctx - cx) * (reduce ? 1 : .2); cy += (cty - cy) * (reduce ? 1 : .2);
        ring.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
        requestAnimationFrame(tick);
      })();
    }

    var wipe = document.createElement('div');
    wipe.id = 'cWipe'; wipe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(wipe);
    window.addEventListener('hashchange', function () {
      if (reduce || !wipe.animate) return;
      wipe.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 800, easing: 'cubic-bezier(.7,0,.2,1)' });
    });
    window.addEventListener('scroll', function () { root.style.setProperty('--sy', String(Math.min(window.scrollY, 600))); }, { passive: true });
  }

  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();

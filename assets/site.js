/* Cre8tive Solutions — page behaviour and motion (GSAP + ScrollTrigger). */
(function () {
  'use strict';
  var D = window.SITE_DATA, ACCENT = D.accent;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var cl = function (v) { return Math.max(0, Math.min(1, v)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
  var state = { i: 0, sec: 'Front', back: false, log: 0, ind: 0, indTouched: false };
  var motionOn = false, flowST = null, flowDur = 8.2;
  // which part of the stage to centre on narrow screens: website (235), system (865) or both (550)
  var FOCUS = [235, 235, 865, 235, 865, 865, 865, 550], focus = { f: 235 };

  /* ---------- scroll story captions + step pips ---------- */
  function setStep(i) {
    if (i === state.i) return;
    state.i = i;
    $$('.cap').forEach(function (c, k) {
      c.style.opacity = k === i ? 1 : 0;
      c.style.filter = 'blur(' + (k === i ? 0 : 8) + 'px)';
      c.style.transform = 'translateY(' + (k < i ? -12 : k > i ? 12 : 0) + 'px)';
    });
    $$('.pip').forEach(function (p, k) {
      p.style.width = (k === i ? 26 : 8) + 'px';
      p.style.background = k <= i ? ACCENT : '#D2D0C9';
    });
    $('#dotLbl').textContent = D.dot[i];
    if (window.gsap) gsap.to(focus, { f: FOCUS[i], duration: 0.9, ease: 'power3.inOut', onUpdate: tick, overwrite: true });
    else { focus.f = FOCUS[i]; tick(); }
  }
  function goStep(k) {
    if (!flowST) { setStep(k); return; }
    var y = flowST.start + (flowST.end - flowST.start) * Math.min(1, (k + 0.6) / flowDur);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  $$('.pip').forEach(function (p) { p.addEventListener('click', function () { goStep(+p.dataset.k); }); });

  /* ---------- section label + activity bubble ---------- */
  function renderSec() { $('#secLbl').textContent = state.back ? state.sec + ' · wiring' : state.sec; }
  function setSec(s) {
    if (s === state.sec) return;
    state.sec = s; renderSec();
    var hide = s === 'The flow' || s === 'Industries', t = $('#toast');
    t.style.opacity = hide ? 0 : 1;
    t.style.transform = 'translateY(' + (hide ? 12 : 0) + 'px)';
  }
  setInterval(function () { state.log = (state.log + 1) % D.log.length; $('#logTxt').textContent = D.log[state.log]; }, 3200);

  /* ---------- front / back switch ---------- */
  function setBack(b) {
    state.back = b;
    var pg = $('#pg');
    pg.classList.toggle('back', b); pg.classList.toggle('front', !b);
    $('#btnFront').setAttribute('aria-pressed', String(!b));
    $('#btnBack').setAttribute('aria-pressed', String(b));
    $('#btnBack').textContent = b ? 'Back ●' : 'Back';
    $('#logTag').textContent = b ? 'BACK' : 'LIVE DEMO';
    renderSec();
  }
  $('#btnFront').addEventListener('click', function () { setBack(false); });
  $('#btnBack').addEventListener('click', function () { setBack(true); });

  /* ---------- industries ---------- */
  function setInd(k) {
    if (k === state.ind) return;
    state.ind = k;
    var d = D.ind[k];
    $$('.indrow').forEach(function (r, n) { r.classList.toggle('on', n === k); });
    $('#indN').textContent = pad(k + 1);
    $('#indBig').textContent = pad(k + 1);
    $('#indName').textContent = d[0];
    $('#indPain').textContent = d[2];
    $('#indFront').innerHTML = d[3].map(function (t) { return '<div style="display:flex;gap:10px;font-size:15px;line-height:1.35"><span style="color:' + ACCENT + '">✓</span>' + esc(t) + '</div>'; }).join('');
    $('#indBack').innerHTML = d[4].map(function (t) { return '<div style="display:flex;gap:10px;font-size:15px;line-height:1.35"><span style="color:#8EA0FF">✓</span>' + esc(t) + '</div>'; }).join('');
    $('#indFlow').innerHTML = d[5].map(function (t, n) {
      var bg = n === 3 ? ACCENT : (n === 0 ? '#121214' : '#EDECE7'), fg = (n === 0 || n === 3) ? '#fff' : '#121214';
      return '<span class="fc" style="display:inline-flex;align-items:center;gap:8px;background:' + bg + ';color:' + fg + ';border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600">' + esc(t) + '</span>' +
        (n < 3 ? '<span class="fc" aria-hidden="true" style="width:22px;border-top:1.5px dashed #B9B7B0"></span>' : '');
    }).join('');
    if (motionOn) {
      gsap.fromTo('#indPanel .ip', { opacity: 0, y: 16, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out', stagger: 0.06, overwrite: true });
      gsap.fromTo('#indPanel .fc', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.06, delay: 0.25, overwrite: true });
    }
  }
  $$('.indrow').forEach(function (r) {
    var pick = function () { state.indTouched = true; setInd(+r.dataset.k); };
    r.addEventListener('click', pick); r.addEventListener('mouseenter', pick);
  });
  setInterval(function () {
    if (state.indTouched) return;
    var r = $('#industries').getBoundingClientRect();
    if (r.top < innerHeight * 0.7 && r.bottom > innerHeight * 0.3) setInd((state.ind + 1) % D.ind.length);
  }, 4000);

  /* ---------- per-frame layout: progress bar, rail, stage scale, falling dot ---------- */
  var raf = 0;
  function onScroll() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; tick(); }); }
  function tick() {
    var vh = innerHeight, pg = $('#pg'), wr = pg.getBoundingClientRect();
    var total = cl(-wr.top / Math.max(1, wr.height - vh));
    $('#topbar').style.transform = 'scaleX(' + total + ')';
    $('#railDot').style.top = (total * 100) + '%';
    var stick = $('#flowStick'), sw = $('#stageWrap'), stg = $('#stage');
    if (vh > 480 && vh < 1400) stick.style.height = (vh - 62) + 'px';
    var narrow = sw.clientWidth < 760;
    var s = Math.max(0.3, Math.min(1, sw.clientWidth / (narrow ? 500 : 1100), (sw.clientHeight - 48) / 490));
    var tx = narrow ? -(focus.f - 550) * s : 0;
    stg.style.transform = 'translateX(' + tx + 'px) scale(' + s + ')';
    var sec = 'Front', tr = $('#flowTrack');
    if (tr.getBoundingClientRect().top < vh * 0.5) sec = 'The flow';
    if ($('#industries').getBoundingClientRect().top < vh * 0.5) sec = 'Industries';
    if ($('#underneath').getBoundingClientRect().top < vh * 0.5) sec = 'Underneath';
    if ($('#prices').getBoundingClientRect().top < vh * 0.5) sec = 'Prices';
    if ($('#contact').getBoundingClientRect().top < vh * 0.6) sec = 'Talk';
    setSec(sec);
    var ev = $('#eight'), sd = $('#stageDot'), dot = $('#fall'), ld = $('#loopDot');
    var a = ev.getBoundingClientRect(), b = sd.getBoundingClientRect();
    var sx = a.left + a.width * 0.5, sy = a.top + a.height * (428 / 450), ex = b.left + b.width / 2, ey = b.top + b.height / 2;
    var trTop = tr.getBoundingClientRect().top - wr.top, pinned = tr.getBoundingClientRect().top <= 63;
    var t = pinned ? 1 : cl((-wr.top - 24) / Math.max(1, trTop - 62 - 24));
    var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    dot.style.transform = 'translate(' + (sx + (ex - sx) * e - wr.left) + 'px,' + (sy + (ey - sy) * t - wr.top) + 'px)';
    dot.style.opacity = t > 0 && t < 1 ? '1' : '0';
    ld.style.opacity = t > 0 ? '0' : '1';
    sd.style.opacity = t >= 1 || t === 0 ? '1' : '0';
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  tick();

  /* ---------- motion (GSAP) ---------- */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  motionOn = true;

  // 1. intro
  var intro = gsap.timeline({ delay: 0.1, defaults: { ease: 'expo.out' } });
  intro.from('.nv', { y: -14, opacity: 0, stagger: 0.05, duration: 0.8 }, 0)
    .from('#hero .lni', { yPercent: 118, duration: 1.3, stagger: 0.09 }, 0.1)
    .from('#eyebrow', { opacity: 0, y: 12, duration: 0.9 }, 0.2)
    .from('#eIntro', { scale: 0.5, rotation: -40, y: 90, opacity: 0, duration: 2, transformOrigin: '50% 60%' }, 0.15)
    .from('#eShadow', { scaleX: 0.15, opacity: 0, duration: 1.8 }, 0.35)
    .from('.lead', { scaleX: 0, duration: 0.7, ease: 'power3.inOut' }, 1.1)
    .from('.elab', { opacity: 0, duration: 0.6, stagger: 0.12 }, 1.1)
    .from(['#heroP', '#heroBtns'], { y: 28, opacity: 0, filter: 'blur(8px)', stagger: 0.12, duration: 1.2 }, 0.65);
  gsap.to('#eFloat', { y: -12, rotation: 2, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  // 2. hero parallax
  var heroST = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
  gsap.to('#eScroll', { yPercent: -22, rotation: 16, scale: 0.72, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hl1 .lni, .hl2 .lni', { xPercent: -6, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hl3 .lni, .hl4 .lni', { xPercent: 6, ease: 'none', scrollTrigger: heroST });
  ['#heroP', '#heroBtns'].forEach(function (sel) {
    gsap.fromTo(sel, { y: 0, opacity: 1 }, { y: -30, opacity: 0.25, ease: 'none', immediateRender: false, scrollTrigger: { trigger: sel, start: 'top 22%', end: 'bottom top', scrub: 0.6 } });
  });

  // 3. 3D tilt on the 8 (mouse only)
  if (matchMedia('(hover: hover)').matches) {
    gsap.set('#eTilt', { transformPerspective: 900 });
    var rx = gsap.quickTo('#eTilt', 'rotationX', { duration: 0.8, ease: 'power3' });
    var ry = gsap.quickTo('#eTilt', 'rotationY', { duration: 0.8, ease: 'power3' });
    var tx = gsap.quickTo('#ringTop', 'x', { duration: 1, ease: 'power3' });
    var ty = gsap.quickTo('#ringTop', 'y', { duration: 1, ease: 'power3' });
    var bx = gsap.quickTo('#ringBot', 'x', { duration: 1.2, ease: 'power3' });
    var hero = $('#hero');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      rx(-ny * 18); ry(nx * 24); tx(nx * 16); ty(ny * 10); bx(-nx * 10);
    });
    hero.addEventListener('mouseleave', function () { rx(0); ry(0); tx(0); ty(0); bx(0); });

    // 4. magnetic buttons
    $$('.mag').forEach(function (el) {
      var qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.3); qy((e.clientY - r.top - r.height / 2) * 0.4); });
      el.addEventListener('mouseleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' }); });
    });
  }

  // 5. the flow — scroll-scrubbed story
  var P = [[110, -26], [124, 216], [865, 92], [348, 232], [865, 232], [1034, 300], [802, 356], [550, 300]];
  gsap.set('#sdot', { x: P[0][0], y: P[0][1] });
  var tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } });
  tl.from('#wFrame', { clipPath: 'inset(0% 0% 100% 0% round 14px)', y: 30, opacity: 0, duration: 0.9 }, 0)
    .from('#wDims', { scaleX: 0, opacity: 0 }, 0.15)
    .from('#wSearch', { y: 18, opacity: 0, scale: 0.9 }, 0.25)
    .from('.wh', { scaleX: 0, transformOrigin: 'left', stagger: 0.08 }, 0.4)
    .from('.wf', { x: -24, opacity: 0, stagger: 0.1 }, 1)
    .from('.fv', { clipPath: 'inset(0% 100% 0% 0%)', stagger: 0.15, duration: 0.5, ease: 'steps(12)' }, 1.15)
    .from('#wBtn', { scale: 0.5, opacity: 0, ease: 'back.out(2.2)' }, 1.55)
    .fromTo('#conn1', { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 2)
    .from('#sFrame', { x: 70, opacity: 0, clipPath: 'inset(0% 0% 0% 100% round 14px)', duration: 0.95 }, 2.05)
    .from('#sDims', { scaleX: 0, opacity: 0 }, 2.2)
    .from('#rowQ', { y: 16, opacity: 0 }, 2.5)
    .from('#cal', { y: 16, opacity: 0 }, 3)
    .from('.cd', { scale: 0.3, opacity: 0, stagger: { each: 0.015, from: 'random' }, duration: 0.4 }, 3.05)
    .to('#d12', { backgroundColor: ACCENT, color: '#fff', scale: 1.25, duration: 0.25 }, 3.55)
    .to('#d12', { scale: 1, duration: 0.25, ease: 'back.out(3)' }, 3.8)
    .from('#dep', { opacity: 0, x: -10 }, 3.75)
    .from('#rowB', { y: 16, opacity: 0 }, 3.6)
    .from('#sched', { y: 12, opacity: 0 }, 4)
    .from('.bar', { scaleX: 0, stagger: 0.12, duration: 0.9, ease: 'expo.out' }, 4.15)
    .from('#phone', { y: 160, rotation: 12, opacity: 0, duration: 1, ease: 'expo.out' }, 5)
    .from('.tick', { opacity: 0, x: -10, stagger: 0.12 }, 5.4)
    .from('#inv', { y: 16, opacity: 0 }, 6)
    .fromTo('#conn2', { opacity: 0 }, { opacity: 1 }, 6.1)
    .from('#stamp', { scale: 2.6, rotation: -18, opacity: 0, ease: 'back.out(2.4)', duration: 0.5 }, 6.35)
    .to(['#wFrame', '#sFrame'], { boxShadow: '0 0 0 2px ' + ACCENT + ', 0 40px 80px rgba(18,18,20,.18)', duration: 0.6 }, 7)
    .from('#cta', { scale: 0.6, opacity: 0, ease: 'back.out(1.8)' }, 7.1)
    .to({}, { duration: 0.5 }, 7.7);
  for (var k = 1; k < 8; k++) tl.to('#sdot', { x: P[k][0], y: P[k][1], duration: 0.6, ease: 'power2.inOut' }, k - 0.1);
  flowDur = tl.duration();
  var pctEl = $('#pctNum');
  flowST = ScrollTrigger.create({
    trigger: '#flowTrack', start: 'top top+=62', end: 'bottom bottom', scrub: 0.8, animation: tl,
    onUpdate: function (self) {
      pctEl.textContent = String(Math.round(self.progress * 100)).padStart(3, '0');
      setStep(Math.max(0, Math.min(7, Math.floor(self.progress * flowDur + 0.15))));
    }
  });

  // 6. section reveals
  $$('.mh').forEach(function (h) {
    gsap.from(h.querySelectorAll('.lni'), { yPercent: 118, duration: 1.2, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
  });
  gsap.set('.rv', { opacity: 0, y: 40, filter: 'blur(8px)' });
  ScrollTrigger.batch('.rv', { start: 'top 88%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.1 }); } });
  gsap.from('#priceList .rl', { scaleX: 0, duration: 1.3, ease: 'expo.inOut', stagger: 0.07, scrollTrigger: { trigger: '#priceList', start: 'top 80%', once: true } });
  gsap.from('.prow > :not(.rl):not(.anno)', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.03, scrollTrigger: { trigger: '#priceList', start: 'top 78%', once: true } });
  $$('.rv .rl').forEach(function (l) { gsap.from(l, { scaleX: 0, duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: l, start: 'top 90%', once: true } }); });

  // 7. statement, word by word
  gsap.to('#stmt .w', { color: '#121214', stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '#stmt', start: 'top 82%', end: 'bottom 45%', scrub: 0.5 } });

  // 8. closing card expands
  gsap.fromTo('#ctaCard', { clipPath: 'inset(8% 4% 0% 4% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 25%', scrub: 0.6 } });

  // 9. the lens — follows the mouse, or a finger on phones (tap or drag sideways)
  var box = $('#lens'), top = box.querySelector('.lensTop'), ring = box.querySelector('.lensRing');
  var R = function () { return box.clientWidth < 600 ? 92 : 120; };
  gsap.set(ring, { left: 0, top: 0, margin: 0 });
  var L = { x: box.clientWidth * 0.3, y: box.clientHeight * 0.45, r: R() };
  function render() { top.style.clipPath = 'circle(' + L.r + 'px at ' + L.x + 'px ' + L.y + 'px)'; gsap.set(ring, { x: L.x - 126, y: L.y - 126, scale: L.r / 120 }); }
  function makeIdle() {
    var w = box.clientWidth, h = box.clientHeight;
    return gsap.timeline({ repeat: -1, onUpdate: render, defaults: { duration: 3.2, ease: 'sine.inOut' } })
      .to(L, { x: w * 0.7, y: h * 0.32 }).to(L, { x: w * 0.5, y: h * 0.72 }).to(L, { x: w * 0.3, y: h * 0.45 });
  }
  render();
  var idle = makeIdle(), resumeT = 0;
  function moveTo(e, big) {
    var r = box.getBoundingClientRect();
    idle.pause(); clearTimeout(resumeT);
    gsap.to(L, { x: e.clientX - r.left, y: e.clientY - r.top, r: R() * (big ? 1.12 : 1), duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: render });
  }
  function release(delay) {
    clearTimeout(resumeT);
    resumeT = setTimeout(function () { gsap.to(L, { r: R(), duration: 0.5, onUpdate: render }); idle.kill(); idle = makeIdle(); }, delay);
  }
  box.addEventListener('pointerdown', function (e) { moveTo(e, true); });
  box.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.buttons) moveTo(e, true); });
  box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') release(0); });
  box.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') release(3500); });
  box.addEventListener('pointercancel', function () { release(3500); });
  addEventListener('resize', function () { L.r = R(); idle.kill(); idle = makeIdle(); });

  addEventListener('load', function () { ScrollTrigger.refresh(); tick(); });
})();

/* Dad's Famous Sourdough Loaf: behavior only. Recipe data is in js/content.js. */
(function () {
  'use strict';
  var D = window.SOURDOUGH;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ls = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var reduceMotion = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  /* iOS Safari only applies :active when a touch listener exists */
  document.addEventListener('touchstart', function () {}, { passive: true });

  /* ---------- segmented controls with a sliding thumb ---------- */
  function initSeg(container, itemSel, isOn) {
    var thumb = document.createElement('span');
    thumb.className = 'thumb'; thumb.setAttribute('aria-hidden', 'true');
    container.insertBefore(thumb, container.firstChild);
    container.classList.add('has-thumb');
    function place(animate) {
      var el = null, items = container.querySelectorAll(itemSel);
      for (var i = 0; i < items.length; i++) if (isOn(items[i])) el = items[i];
      if (!el || !el.offsetWidth) return;
      if (!animate || reduceMotion()) thumb.style.transition = 'none';
      thumb.style.width = el.offsetWidth + 'px';
      thumb.style.height = el.offsetHeight + 'px';
      thumb.style.transform = 'translate(' + el.offsetLeft + 'px,' + el.offsetTop + 'px)';
      if (!animate || reduceMotion()) { void thumb.offsetWidth; thumb.style.transition = ''; }
    }
    if (window.ResizeObserver) new ResizeObserver(function () { place(false); }).observe(container);
    window.addEventListener('resize', function () { place(false); });
    place(false);
    return place;
  }

  /* ---------- tabs ---------- */
  var VIEWS = ['recipe', 'checks', 'schedule', 'fixes'];
  var scrollPos = {}, current = null;
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  var navLinks = document.querySelectorAll('#nav a');
  var placeNav = initSeg($('nav'), 'a', function (a) { return a.getAttribute('aria-current') === 'page'; });
  function route(first) {
    var h = location.hash.replace('#', '');
    var v = VIEWS.indexOf(h) >= 0 ? h : 'recipe';
    if (v === current) return;
    if (current) scrollPos[current] = window.scrollY;
    VIEWS.forEach(function (x) {
      var s = $('v-' + x);
      s.classList.toggle('on', x === v);
      s.classList.remove('fade');
    });
    navLinks.forEach(function (a) {
      if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    current = v;
    placeNav(!first);
    window.scrollTo(0, scrollPos[v] || 0);
    if (!first && !reduceMotion()) { var el = $('v-' + v); void el.offsetWidth; el.classList.add('fade'); }
    updateHeader();
  }
  window.addEventListener('hashchange', function () { route(false); });
  $('nav').addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    if (a.dataset.v === current) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  });
  function updateHeader() { $('top').classList.toggle('scrolled', window.scrollY > 2); }
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ---------- lightbox (FLIP) ---------- */
  var lb = $('lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.cap'), lbClose = lb.querySelector('.lbclose'), scrim = lb.querySelector('.scrim');
  var lbTrigger = null, lbOpen = false, lbBusy = false, dragging = null;
  var EASE = 'cubic-bezier(.3,.7,.4,1)';
  function flipFrom(rect, final) {
    var dx = (rect.left + rect.width / 2) - (final.left + final.width / 2);
    var dy = (rect.top + rect.height / 2) - (final.top + final.height / 2);
    var s = rect.width / final.width;
    return 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
  }
  function thumbRect() {
    if (!lbTrigger || !document.contains(lbTrigger)) return null;
    var r = lbTrigger.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return null;
    return r;
  }
  function openLightbox(trigger, title) {
    if (lbOpen || lbBusy) return;
    var src = trigger.querySelector('img');
    lbTrigger = trigger; lbOpen = true; lbBusy = true;
    lbCap.textContent = title || '';
    lbImg.alt = title || '';
    lbImg.style.transform = ''; scrim.style.opacity = '';
    lbImg.src = src.currentSrc || src.src;
    lb.hidden = false;
    $('main').inert = true; $('top').inert = true;
    lbClose.focus({ preventScroll: true });
    var go = function () {
      var final = lbImg.getBoundingClientRect(), from = thumbRect();
      if (from && !reduceMotion() && final.width) {
        lbImg.animate([{ transform: flipFrom(from, final) }, { transform: 'none' }], { duration: 300, easing: EASE });
        scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
        lbCap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
      } else {
        lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
      }
      lbBusy = false;
    };
    (lbImg.decode ? lbImg.decode().catch(function () {}) : Promise.resolve()).then(go);
  }
  function finishClose() {
    [lb, lbImg, scrim, lbCap].forEach(function (el) { el.getAnimations().forEach(function (a) { a.onfinish = a.oncancel = null; a.cancel(); }); });
    lb.hidden = true; lbImg.removeAttribute('src'); lbImg.style.transform = ''; scrim.style.opacity = '';
    $('main').inert = false; $('top').inert = false;
    var t = lbTrigger; lbTrigger = null; lbOpen = false; lbBusy = false;
    if (t && document.contains(t)) t.focus({ preventScroll: true });
  }
  function closeLightbox(fromTransform) {
    if (!lbOpen || lbBusy) return;
    lbBusy = true;
    var to = thumbRect(), final = lbImg.getBoundingClientRect();
    if (reduceMotion() || !to) {
      var a = lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-out', fill: 'forwards' });
      a.onfinish = a.oncancel = finishClose; return;
    }
    // final rect measured with any drag offset removed
    var base = { left: final.left, top: final.top - (fromTransform || 0), width: final.width, height: final.height };
    var a1 = lbImg.animate([{ transform: 'translateY(' + (fromTransform || 0) + 'px)' }, { transform: flipFrom(to, base) }], { duration: 280, easing: EASE, fill: 'forwards' });
    var op = parseFloat(scrim.style.opacity); if (isNaN(op)) op = 1;
    scrim.animate([{ opacity: op }, { opacity: 0 }], { duration: 280, easing: 'ease-out', fill: 'forwards' });
    lbCap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-out', fill: 'forwards' });
    a1.onfinish = a1.oncancel = function () { finishClose(); };
  }
  document.addEventListener('click', function (e) {
    var z = e.target.closest('.zoom[data-zoom]');
    if (!z) return;
    var p = D.photos.filter(function (x) { return x.k === z.dataset.zoom; })[0];
    openLightbox(z, p ? p.t : '');
  });
  lbClose.addEventListener('click', function () { closeLightbox(0); });
  scrim.addEventListener('click', function () { closeLightbox(0); });
  lb.querySelector('.lbfig').addEventListener('click', function (e) { if (e.target === this) closeLightbox(0); });
  document.addEventListener('keydown', function (e) {
    if (!lbOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLightbox(0); }
    else if (e.key === 'Tab') { e.preventDefault(); lbClose.focus(); }
  });
  /* swipe down to dismiss: follows the finger 1:1 */
  lbImg.addEventListener('pointerdown', function (e) {
    if (!lbOpen || lbBusy) return;
    dragging = { id: e.pointerId, y0: e.clientY, dy: 0, last: [{ t: performance.now(), y: e.clientY }] };
    try { lbImg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  lbImg.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== dragging.id) return;
    dragging.dy = Math.max(0, e.clientY - dragging.y0);
    dragging.last.push({ t: performance.now(), y: e.clientY });
    if (dragging.last.length > 6) dragging.last.shift();
    lbImg.style.transform = 'translateY(' + dragging.dy + 'px)';
    scrim.style.opacity = String(Math.max(0, 1 - dragging.dy / 300));
  });
  function endDrag(e) {
    if (!dragging || e.pointerId !== dragging.id) return;
    var d = dragging; dragging = null;
    var a = d.last[0], b = d.last[d.last.length - 1];
    var v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) * 1000 : 0;
    if (d.dy > 120 || (d.dy > 4 && v > 500)) { closeLightbox(d.dy); }
    else if (d.dy > 0) {
      lbImg.animate([{ transform: 'translateY(' + d.dy + 'px)' }, { transform: 'none' }], { duration: reduceMotion() ? 0 : 220, easing: EASE });
      lbImg.style.transform = ''; scrim.style.opacity = '';
    }
  }
  lbImg.addEventListener('pointerup', endDrag);
  lbImg.addEventListener('pointercancel', endDrag);

  /* ---------- photos ---------- */
  var photoSrc = function (k) {
    return '<picture><source srcset="photos/' + k + '.webp" type="image/webp"><img src="photos/' + k + '.jpg" ';
  };
  function renderPhotos() {
    $('photos').innerHTML = D.photos.map(function (p) {
      return '<article class="ph"><div class="frame"><button type="button" class="zoom" data-zoom="' + esc(p.k) + '" aria-label="Enlarge photo: ' + esc(p.t) + '">' +
        photoSrc(p.k) + 'alt="' + esc(p.t) + '" width="1600" height="1200" loading="lazy" decoding="async"></picture></button></div>' +
        '<div class="info"><span class="k">' + esc(p.when) + '</span><span class="t">' + esc(p.t) + '</span><span class="tip">' + esc(p.tip) + '</span></div></article>';
    }).join('');
  }
  /* image error handling: try the jpg if webp is missing, then show the placeholder or drop the thumbnail */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    var pic = img.parentNode;
    if (pic && pic.tagName === 'PICTURE' && pic.querySelector('source')) {
      var cur = img.currentSrc || '';
      if (/\.webp(\?|$)/.test(cur)) {
        pic.querySelectorAll('source').forEach(function (s) { s.remove(); });
        var s = img.getAttribute('src'); img.removeAttribute('src'); img.setAttribute('src', s);
        return;
      }
    }
    var zoom = img.closest('.zoom'); if (!zoom) return;
    var frame = zoom.parentNode;
    if (frame.classList.contains('frame')) { frame.classList.add('empty'); frame.innerHTML = '<div>Photo coming soon</div>'; }
    else if (zoom.closest('.thumbs')) { zoom.remove(); }
  }, true);

  /* step thumbnails stay invisible (no layout space) until the photo actually loads */
  document.addEventListener('load', function (e) {
    var img = e.target;
    if (img && img.tagName === 'IMG') { var z = img.closest('.thumbs .zoom'); if (z) z.classList.add('ok'); }
  }, true);

  /* ---------- recipe ---------- */
  var loaves = 2, schedReady = false;
  var done = (ls.get('sd-steps') || []).filter(function (i) { return typeof i === 'number'; });
  var stepCount = D.stepsFor(2).length;
  function renderStepStatus() {
    var n = done.filter(function (i) { return i < stepCount; }).length;
    $('stepCount').textContent = n + ' of ' + stepCount + ' done';
  }
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  function renderSteps() {
    $('steps').innerHTML = D.stepsFor(loaves).map(function (s, i) {
      var ph = (D.stepPhotos[i] || []);
      var on = done.indexOf(i) >= 0;
      return '<div class="step' + (on ? ' done' : '') + (ph.length ? ' hasthumbs' : '') + '" data-i="' + i + '">' +
        '<div class="toggle" role="checkbox" tabindex="0" aria-checked="' + on + '"><div class="num" aria-hidden="true"><span class="n">' + (i + 1) + '</span>' + CHECK + '</div>' +
        '<div class="body"><div class="txt"><span class="name">' + s[0] + '</span>' + (s[1] ? '<span class="dur">' + s[1] + '</span>' : '') + '<div>' + s[2] + '</div></div></div></div>' +
        (ph.length ? '<div class="thumbs">' + ph.map(function (k) {
          var p = D.photos.filter(function (x) { return x.k === k; })[0];
          var t = p ? p.t : k;
          return '<button type="button" class="zoom" data-zoom="' + esc(k) + '" aria-label="Enlarge photo: ' + esc(t) + '">' + photoSrc(k) + 'alt="' + esc(t) + '" width="128" height="96" loading="lazy" decoding="async"></picture></button>';
        }).join('') + '</div>' : '') + '</div>';
    }).join('');
    renderStepStatus();
  }
  function toggleStep(el) {
    var i = Number(el.dataset.i), on = done.indexOf(i) < 0;
    done = on ? done.concat(i) : done.filter(function (x) { return x !== i; });
    ls.set('sd-steps', done);
    el.classList.toggle('done', on);
    el.querySelector('[role=checkbox]').setAttribute('aria-checked', String(on));
    hideUndo(); renderStepStatus();
  }
  $('steps').addEventListener('click', function (e) {
    var t = e.target.closest('.toggle'); if (!t) return;
    toggleStep(t.parentNode);
  });
  $('steps').addEventListener('keydown', function (e) {
    var t = e.target.closest('.toggle'); if (!t || e.target !== t) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleStep(t.parentNode); }
  });
  var undoTimer = null, cleared = null;
  function hideUndo() { clearTimeout(undoTimer); cleared = null; $('clearStatus').textContent = ''; }
  $('clearSteps').addEventListener('click', function () {
    if (!done.length) return;
    cleared = done; done = []; ls.set('sd-steps', done); renderSteps();
    var st = $('clearStatus'); st.textContent = 'Checks cleared. ';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.textContent = 'Undo';
    b.addEventListener('click', function () { done = cleared || []; ls.set('sd-steps', done); hideUndo(); renderSteps(); });
    st.appendChild(b);
    clearTimeout(undoTimer); undoTimer = setTimeout(hideUndo, 6000);
  });

  var placeScale = initSeg($('scale'), 'button', function (b) { return b.getAttribute('aria-pressed') === 'true'; });
  function renderIng(n, animate) {
    loaves = n;
    $('ing').innerHTML = D.ingredients.map(function (r) {
      return '<div class="row"><span class="label">' + r[0] + (r[1] ? '<small>' + r[1] + '</small>' : '') + '</span><span class="val strong">' + (r[2] * n) + r[3] + '</span></div>';
    }).join('');
    document.querySelectorAll('#scale button').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.n) === n)); });
    placeScale(animate);
    $('bigBatch').style.display = n === 4 ? 'block' : 'none';
    renderSteps();
    if (schedReady) buildSchedule();
  }
  document.querySelectorAll('#scale button').forEach(function (b) { b.addEventListener('click', function () { renderIng(Number(b.dataset.n), true); }); });

  $('formula').innerHTML = D.formula.map(function (r) {
    return '<div class="row"><span class="label">' + r[0] + '<small>' + r[1] + '</small></span><span class="val strong">' + r[2] + '</span></div>';
  }).join('');
  $('why').innerHTML = D.whyItWorks.map(function (c) { return '<div class="card"><h4>' + c[0] + '</h4><p>' + c[1] + '</p></div>'; }).join('');
  $('before').innerHTML = D.beforeEveryBake.map(function (t) { return '<div class="row">' + t + '</div>'; }).join('');

  /* ---------- checks ---------- */
  $('checkList').innerHTML = D.checks.map(function (c) {
    return '<div class="card check"><div class="when">' + c.when + '</div><h4>' + c.title + '</h4><div class="pill-ok">' + c.ok + '</div><div class="pill-no">' + c.no + '</div>' +
      (c.note ? '<p class="note" style="margin-top:.6rem">' + c.note + '</p>' : '') + '</div>';
  }).join('');

  /* ---------- troubleshooting ---------- */
  $('fixList').innerHTML = D.fixes.map(function (g) {
    return '<h3 class="sh">' + g.group + '</h3>' + g.items.map(function (f) {
      return '<div class="card"><h4>' + f[0] + '</h4><ol class="fx">' + f[1].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
        (f[2].length ? '<div class="src">Source: ' + f[2].map(function (k) { return '<a href="' + D.sources[k][0] + '" rel="noopener">' + D.sources[k][1] + '</a>'; }).join(' · ') + '</div>' : '') + '</div>';
    }).join('');
  }).join('') + '<p class="footer" style="margin-top:1.25rem">' + D.attribution + '</p>';

  /* ---------- schedule ---------- */
  var BAKE_MIN = D.schedule.bakeMin, COOL_MIN = D.schedule.coolMin, EXTRA = D.schedule.extraLoafMin;
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var toLocalInput = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var defaultWhen = function () { var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return toLocalInput(d); };
  var addMin = function (d, m) { return new Date(d.getTime() + m * 60000); };
  var fmtTime = function (d) { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
  var fmtDay = function (d) { return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }); };
  var isNight = function (d) { var h = d.getHours(); return h >= 23 || h < 6; };
  var num = function (id, fb) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : fb; };

  var ss = ls.get('sd-sched');
  $('when').value = (ss && ss.when) || defaultWhen();
  $('anchor').value = (ss && ss.anchor) || 'oven';
  if (ss) { if (ss.peak) $('peak').value = ss.peak; if (ss.bulk) $('bulk').value = ss.bulk; if (ss.cold) $('cold').value = ss.cold; }

  var lastSteps = [];
  function buildSchedule() {
    $('loafNote').textContent = loaves + (loaves === 1 ? ' loaf' : ' loaves') + ' (change on the Recipe tab)';
    var picked = new Date($('when').value);
    if (isNaN(picked)) { $('sched').innerHTML = ''; return; }
    var peak = num('peak', 5), bulk = num('bulk', 4.5), cold = num('cold', 14);
    var anchor = $('anchor').value;
    /* Feed to oven: starter peak, 10 min to bulk, bulk, 45 min preshape + shape, cold proof. */
    var feedToOven = (peak + bulk + cold) * 60 + 55;
    var oven = anchor === 'slice' ? addMin(picked, -(BAKE_MIN + COOL_MIN)) : anchor === 'start' ? addMin(picked, feedToOven) : picked;
    var fridge = addMin(oven, -cold * 60), shape = addMin(fridge, -15), preshape = addMin(shape, -30);
    var bulkStart = addMin(preshape, -bulk * 60), salt = addMin(bulkStart, -6), starter = addMin(bulkStart, -10);
    var autolyse = addMin(starter, -45), feed = addMin(starter, -peak * 60), out = addMin(oven, BAKE_MIN);
    var multi = loaves > 1;
    var steps = [
      { t: feed, s: 'Feed starter', n: 'Should peak in about ' + peak + ' hrs, right when you mix.' },
      { t: autolyse, s: 'Autolyse', n: 'Flours + water, speed 1 for 1 min. Rest 45 min.' },
      { t: starter, s: 'Add starter', n: 'Check it has peaked. Speed 1 for 1 min, then speed 2 for 3 min.' },
      { t: salt, s: 'Add salt + held-back water', n: 'Speed 2 for 3–5 min, then windowpane test.' },
      { t: bulkStart, s: 'Bulk ferment starts', n: 'Into the oiled container. Mark the starting level.', key: true },
      { t: addMin(bulkStart, 30), s: 'Coil fold 1', n: '' },
      { t: addMin(bulkStart, 60), s: 'Coil fold 2', n: '' },
      { t: addMin(bulkStart, 90), s: 'Coil fold 3', n: 'Then leave it alone.' },
      { t: preshape, s: 'Preshape', n: 'Bulk done at 50–75% rise. Round it, rest 30 min.' },
      { t: shape, s: 'Final shape', n: 'Tight boule or batard into the banneton.' },
      { t: fridge, s: 'Into the fridge', n: 'Cold proof ' + cold + ' hrs at 36–40°F.', key: true },
      { t: addMin(oven, -60), s: 'Preheat Dutch oven', n: '500°F, 60 min.' },
      { t: oven, s: multi ? 'Loaf 1: poke test, score, load' : 'Poke test, score, load', n: 'Straight from the fridge. Lid on, drop to 475°F.', key: true },
      { t: addMin(oven, 20), s: 'Lid off', n: 'Drop to 450°F. Bake to 208°F internal.' },
      { t: out, s: multi ? 'Loaf 1 out' : 'Out of the oven', n: 'Onto a rack.' + (multi ? ' Pot back in at 500°F for 10 min.' : '') },
      { t: addMin(out, COOL_MIN), s: multi ? 'Loaf 1 ready to slice' : 'Ready to slice', n: 'After a full 2-hr cool.', key: true, passive: true }
    ];
    for (var k = 2; k <= loaves; k++) {
      var inK = addMin(oven, (k - 1) * EXTRA), outK = addMin(inK, BAKE_MIN);
      steps.push({ t: inK, s: 'Loaf ' + k + ': score and load', n: 'Straight from the fridge. Lid on 20 min at 475°F, then lid off at 450°F.' });
      steps.push({ t: outK, s: 'Loaf ' + k + ' out', n: k < loaves ? 'Pot back in at 500°F for 10 min.' : 'Last one. Turn off the oven.' });
    }
    steps.sort(function (a, b) { return a.t - b.t; });
    lastSteps = steps;
    var prev = '', night = [], html = '';
    steps.forEach(function (st) {
      var day = fmtDay(st.t);
      if (day !== prev) { html += '<div class="dayhead">' + day + '</div>'; prev = day; }
      var n = !st.passive && isNight(st.t);
      if (n) night.push(st.s + ' (' + fmtTime(st.t) + ')');
      html += '<div class="row' + (st.key ? ' key' : '') + (n ? ' night' : '') + '"><span class="time">' + fmtTime(st.t) + '</span><span>' + st.s + (st.n ? '<div class="note">' + st.n + '</div>' : '') + '</span></div>';
    });
    $('sched').innerHTML = html;
    var w = $('warn');
    if (night.length) { w.innerHTML = '<b>Heads up:</b> ' + night.join(', ') + (night.length === 1 ? ' lands' : ' land') + ' overnight. Try a different time or adjust the cold proof.'; w.style.display = 'block'; }
    else w.style.display = 'none';
    ls.set('sd-sched', { when: $('when').value, anchor: $('anchor').value, peak: $('peak').value, bulk: $('bulk').value, cold: $('cold').value });
  }
  ['when', 'anchor', 'peak', 'bulk', 'cold'].forEach(function (id) { $(id).addEventListener('input', buildSchedule); $(id).addEventListener('change', buildSchedule); });
  $('resetSched').addEventListener('click', function () { $('when').value = defaultWhen(); $('anchor').value = 'oven'; $('peak').value = 5; $('bulk').value = 4.5; $('cold').value = 14; buildSchedule(); });
  var copyTimer = null;
  $('copy').addEventListener('click', function () {
    var prev = '';
    var text = "Dad's Famous Sourdough Loaf: schedule\n" + lastSteps.map(function (st) { var d = fmtDay(st.t), h = d !== prev ? '\n' + d + '\n' : ''; prev = d; return h + fmtTime(st.t) + '  ' + st.s; }).join('\n');
    var msg = function (m) { $('copyStatus').textContent = m; clearTimeout(copyTimer); copyTimer = setTimeout(function () { $('copyStatus').textContent = ''; }, 2000); };
    try { navigator.clipboard.writeText(text).then(function () { msg('Copied'); }, function () { msg('Copy blocked by the browser'); }); } catch (e) { msg('Copy blocked by the browser'); }
  });

  /* ---------- keep screen on ---------- */
  var wake = $('wake'), wl = null, wantWake = false;
  function setWake(on) { wantWake = on; wake.setAttribute('aria-checked', String(on)); }
  if (!('wakeLock' in navigator)) {
    wake.disabled = true;
    $('wakeNote').textContent = 'Not supported in this browser';
  } else {
    var acquire = function () {
      return navigator.wakeLock.request('screen').then(function (l) {
        wl = l; l.addEventListener('release', function () { if (wl === l) wl = null; });
      }, function () { setWake(false); $('wakeNote').textContent = 'Could not keep the screen on. Try again.'; });
    };
    wake.addEventListener('click', function () {
      if (wantWake) { setWake(false); if (wl) { wl.release().catch(function () {}); wl = null; } }
      else { setWake(true); $('wakeNote').textContent = 'Stops your phone or tablet from sleeping while this page is open.'; acquire(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && wantWake && !wl) acquire();
    });
  }

  /* ---------- start ---------- */
  renderPhotos();
  renderIng(2, false);
  buildSchedule();
  schedReady = true;
  route(true);
  updateHeader();
})();

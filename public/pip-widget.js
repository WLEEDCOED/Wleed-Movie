/*! Pip — مساعد عائم | ضع هذا الملف في موقعك وأضف: <script src="pip-widget.js" defer></script>
   اختياري قبله: <script>window.PIP_CONFIG = { avoid: '#chat-panel' }</script> */
(function () {
  if (window.__pipLoaded) return; window.__pipLoaded = true;
  function boot() {
    var style = document.createElement('style');
    style.textContent = "/* =====================  Pip — انسخ من هنا  ===================== */\n  #pip {\n    /* التخصيص: غيّر هذي القيم فقط */\n    --pip-size: 150px;\n    --pip-hi: #9cc2ff;\n    --pip-main: #4f80f5;\n    --pip-dark: #2f52c4;\n    --pip-visor: #131a3d;\n    --pip-eye: #a8ecff;\n    --pip-accent: #6ee7c8;\n\n    position: fixed; left: 16px; bottom: env(safe-area-inset-bottom, 0px); z-index: 99999;\n    width: var(--pip-size); direction: ltr;\n    touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;\n    cursor: grab;\n    transition: bottom .45s cubic-bezier(.55, 0, 1, .6);\n  }\n  @media (max-width: 480px) { #pip { --pip-size: 118px; } }\n  #pip.dragging { cursor: grabbing; }\n  #pip svg { width: 100%; height: auto; display: block; overflow: visible; }\n  #pip svg * { transform-box: fill-box; }\n  #pip .flip { transform-origin: 50% 100%; transition: transform .25s ease; }\n\n  /* ---- الجسم والوضعيات ---- */\n  #pip .body-wrap { animation: breathe 3.4s ease-in-out infinite; transition: transform .45s cubic-bezier(.3, 1.35, .5, 1); }\n  @keyframes breathe { 50% { transform: translateY(-2px); } }\n  #pip .leg, #pip .arm { transform-origin: top center; transition: transform .45s cubic-bezier(.3, 1.2, .5, 1); }\n  #pip .eyes { transform: translate(var(--ex, 0px), var(--ey, 0px)); transition: transform .14s ease-out; }\n  #pip .eye { transform-origin: center; animation: blink 4.6s infinite; }\n  @keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.08); } }\n  #pip .bulb { transform-origin: center; animation: glow 2s ease-in-out infinite; }\n  @keyframes glow { 50% { opacity: .55; transform: scale(.82); } }\n  #pip .bulb-glow { transform-origin: center; animation: glow2 2s ease-in-out infinite; }\n  @keyframes glow2 { 50% { opacity: .35; transform: scale(.8); } }\n  #pip .core-dot { animation: glow 2.4s ease-in-out infinite; transform-origin: center; }\n  #pip .shadow { transform-origin: center; transition: transform .45s; }\n  #pip .mouth-focus { opacity: 0; } #pip .mouth { transition: opacity .2s; }\n\n  /* مشي */\n  #pip.walk .body-wrap { animation: bob .38s ease-in-out infinite; }\n  @keyframes bob { 50% { transform: translateY(-5px); } }\n  #pip.walk .leg-l, #pip.walk .arm-r { animation: swingA .38s ease-in-out infinite; }\n  #pip.walk .leg-r, #pip.walk .arm-l { animation: swingB .38s ease-in-out infinite; }\n  @keyframes swingA { 0%, 100% { transform: rotate(24deg); } 50% { transform: rotate(-24deg); } }\n  @keyframes swingB { 0%, 100% { transform: rotate(-24deg); } 50% { transform: rotate(24deg); } }\n  #pip.walk .shadow { animation: shwalk .38s ease-in-out infinite; }\n  @keyframes shwalk { 50% { transform: scaleX(.86); opacity: .7; } }\n\n  /* جلوس */\n  #pip.sit .body-wrap { animation: none; transform: translateY(24px); }\n  #pip.sit .leg { animation: none; }\n  #pip.sit .leg-l { transform: rotate(90deg) scaleY(.75); }\n  #pip.sit .leg-r { transform: rotate(-90deg) scaleY(.75); }\n  #pip.sit .arm-l { animation: none; transform: rotate(-9deg); }\n  #pip.sit .arm-r { animation: none; transform: rotate(12deg); }\n  #pip.sit .shadow { transform: scaleX(1.12); }\n\n  /* لابتوب */\n  #pip .laptop { opacity: 0; transform: translateY(0); transition: opacity .3s, transform .45s cubic-bezier(.3, 1.35, .5, 1); }\n  #pip.sit .laptop { opacity: 1; transform: translateY(-24px); }\n  #pip .lid { transform-origin: bottom center; transform: scaleY(.04); transition: transform .65s cubic-bezier(.3, 1.25, .5, 1); }\n  #pip.laptop-open .lid { transform: scaleY(1); }\n  #pip .code { transform-origin: left center; transform: scaleX(0); }\n  #pip.laptop-open .code { animation: typing 3s ease-out infinite; }\n  #pip .c2 { animation-delay: .35s !important; } #pip .c3 { animation-delay: .7s !important; }\n  #pip .c4 { animation-delay: 1.05s !important; } #pip .c5 { animation-delay: 1.4s !important; }\n  @keyframes typing { 0% { transform: scaleX(0); opacity: 1; } 40%, 85% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }\n  #pip .cursor { opacity: 0; }\n  #pip.laptop-open .cursor { animation: cur 1s steps(1) infinite; }\n  @keyframes cur { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }\n  #pip.laptop-open .eyes { transform: translate(0, 2px); }\n  #pip .happy { opacity: 0; transition: opacity .2s; }\n  #pip.laptop-open .happy { opacity: 1; }\n  #pip.laptop-open .eye { opacity: 0; }\n  #pip.laptop-open .arm-r { animation: tapR .24s ease-in-out infinite; }\n  #pip.laptop-open .arm-l { animation: tapL .24s ease-in-out infinite .12s; }\n  @keyframes tapR { 0%, 100% { transform: rotate(12deg); } 50% { transform: rotate(22deg); } }\n  @keyframes tapL { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(-19deg); } }\n  #pip.laptop-open .core-dot { animation-duration: .7s; }\n\n  /* قفزة */\n  #pip.hop .flip { animation: hop .55s cubic-bezier(.3, 0, .3, 1); }\n  @keyframes hop { 0%, 100% { transform: translateY(0) scaleX(var(--dir, 1)) scaleY(1); }\n    15% { transform: translateY(0) scaleX(calc(var(--dir, 1) * 1.08)) scaleY(.9); }\n    45% { transform: translateY(-30px) scaleX(var(--dir, 1)) scaleY(1.05); }\n    80% { transform: translateY(0) scaleX(calc(var(--dir, 1) * 1.06)) scaleY(.94); } }\n\n  /* أثناء السحب */\n  #pip.dragging .body-wrap { animation: none; }\n  #pip.dragging .arm-l { transform: rotate(160deg); } #pip.dragging .arm-r { transform: rotate(-160deg); }\n  #pip.dragging .leg-l { animation: dangleA .55s ease-in-out infinite; }\n  #pip.dragging .leg-r { animation: dangleB .55s ease-in-out infinite; }\n  @keyframes dangleA { 50% { transform: rotate(-14deg); } 0%, 100% { transform: rotate(12deg); } }\n  @keyframes dangleB { 50% { transform: rotate(14deg); } 0%, 100% { transform: rotate(-12deg); } }\n  #pip.dragging .shadow { opacity: 0; }\n\n  /* فقاعة الحالة */\n  #pip .bubble {\n    position: absolute; left: 42%; top: 9%; z-index: 2;\n    transform: translate(-50%, -100%) scale(.92); transform-origin: 50% 100%;\n    display: flex; align-items: center; gap: 8px; direction: rtl; white-space: nowrap;\n    padding: 7px 13px 7px 12px; border-radius: 999px;\n    background: #fff; color: #231f2e; font-size: 13px; font-weight: 600; line-height: 1;\n    box-shadow: 0 8px 24px rgba(0, 0, 0, .28), 0 0 0 1px rgba(0, 0, 0, .05);\n    opacity: 0; pointer-events: none; transition: opacity .25s, transform .25s cubic-bezier(.3, 1.4, .5, 1);\n  }\n  #pip .bubble.show { opacity: 1; transform: translate(-50%, -100%) scale(1); }\n  #pip .ind { width: 8px; height: 8px; border-radius: 50%; background: var(--pip-accent); box-shadow: 0 0 0 3px rgba(110, 231, 160, .25); flex: none; }\n  #pip .bubble.busy .ind { width: 12px; height: 12px; background: none; box-shadow: none; border: 2px solid rgba(35, 31, 46, .15); border-top-color: var(--pip-main); animation: spin .8s linear infinite; box-sizing: border-box; }\n  @keyframes spin { to { transform: rotate(360deg); } }\n\n  @media (prefers-reduced-motion: reduce) { #pip *, #pip { animation: none !important; transition-duration: .01s !important; } }\n  ";
    document.head.appendChild(style);
    var holder = document.createElement('div');
    holder.innerHTML = "<div id=\"pip\" role=\"img\" aria-label=\"Pip، مساعد افتراضي\">\n  <div class=\"bubble\" id=\"bubble\" aria-live=\"polite\"><span class=\"ind\"></span><span id=\"btext\"></span></div>\n  <div class=\"flip\">\n    <svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">\n      <defs>\n        <linearGradient id=\"pg-body\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" style=\"stop-color:var(--pip-hi)\"/><stop offset=\"1\" style=\"stop-color:var(--pip-main)\"/></linearGradient>\n        <radialGradient id=\"pg-head\" cx=\".3\" cy=\".18\" r=\".95\"><stop offset=\"0\" style=\"stop-color:var(--pip-hi)\"/><stop offset=\".5\" style=\"stop-color:var(--pip-main)\"/><stop offset=\"1\" style=\"stop-color:var(--pip-dark)\"/></radialGradient>\n        <linearGradient id=\"pg-limb\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" style=\"stop-color:var(--pip-main)\"/><stop offset=\"1\" style=\"stop-color:var(--pip-dark)\"/></linearGradient>\n        <linearGradient id=\"pg-visor\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#2b3a78\"/><stop offset=\"1\" style=\"stop-color:var(--pip-visor)\"/></linearGradient>\n        <radialGradient id=\"pg-eye\" cx=\".4\" cy=\".3\" r=\".75\"><stop offset=\"0\" stop-color=\"#fffbe3\"/><stop offset=\"1\" style=\"stop-color:var(--pip-eye)\"/></radialGradient>\n        <radialGradient id=\"pg-shadow\"><stop offset=\"0\" stop-color=\"#000\" stop-opacity=\".42\"/><stop offset=\"1\" stop-color=\"#000\" stop-opacity=\"0\"/></radialGradient>\n        <radialGradient id=\"pg-glow\"><stop offset=\"0\" style=\"stop-color:var(--pip-accent)\" stop-opacity=\".8\"/><stop offset=\"1\" style=\"stop-color:var(--pip-accent)\" stop-opacity=\"0\"/></radialGradient>\n        <linearGradient id=\"pg-deck\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef2f8\"/><stop offset=\"1\" stop-color=\"#aab4c6\"/></linearGradient>\n        <linearGradient id=\"pg-lid\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#434c6c\"/><stop offset=\"1\" stop-color=\"#262c46\"/></linearGradient>\n        <linearGradient id=\"pg-screen\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1f2742\"/><stop offset=\"1\" stop-color=\"#111626\"/></linearGradient>\n        <radialGradient id=\"pg-sglow\" cx=\".5\" cy=\".4\" r=\".7\"><stop offset=\"0\" stop-color=\"#7cc0f2\" stop-opacity=\".28\"/><stop offset=\"1\" stop-color=\"#7cc0f2\" stop-opacity=\"0\"/></radialGradient>\n      </defs>\n\n      <ellipse class=\"shadow\" cx=\"86\" cy=\"187\" rx=\"48\" ry=\"6.5\" fill=\"url(#pg-shadow)\"/>\n\n      <g class=\"body-wrap\">\n        <!-- أرجل -->\n        <g class=\"leg leg-l\"><rect x=\"64\" y=\"150\" width=\"15\" height=\"30\" rx=\"7.5\" fill=\"url(#pg-limb)\"/><ellipse cx=\"71.5\" cy=\"181\" rx=\"11.5\" ry=\"6\" fill=\"var(--pip-dark)\"/></g>\n        <g class=\"leg leg-r\"><rect x=\"90\" y=\"150\" width=\"15\" height=\"30\" rx=\"7.5\" fill=\"url(#pg-limb)\"/><ellipse cx=\"97.5\" cy=\"181\" rx=\"11.5\" ry=\"6\" fill=\"var(--pip-dark)\"/></g>\n        <!-- يد خلفية -->\n        <g class=\"arm arm-l\"><rect x=\"46\" y=\"128\" width=\"13\" height=\"30\" rx=\"6.5\" fill=\"var(--pip-dark)\"/><circle cx=\"52.5\" cy=\"158\" r=\"7\" fill=\"var(--pip-dark)\"/></g>\n\n        <!-- جسم -->\n        <ellipse cx=\"84\" cy=\"134\" rx=\"34\" ry=\"29\" fill=\"url(#pg-body)\"/>\n        <ellipse cx=\"84\" cy=\"141\" rx=\"19\" ry=\"15\" fill=\"#fff\" opacity=\".16\"/>\n        <circle cx=\"84\" cy=\"141\" r=\"6.5\" fill=\"var(--pip-visor)\"/>\n        <circle class=\"core-dot\" cx=\"84\" cy=\"141\" r=\"3.2\" fill=\"var(--pip-accent)\"/>\n\n        <!-- رأس -->\n        <path d=\"M84 40 Q84 25 93 19\" stroke=\"var(--pip-dark)\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/>\n        <circle class=\"bulb-glow\" cx=\"94\" cy=\"18\" r=\"13\" fill=\"url(#pg-glow)\"/>\n        <circle class=\"bulb\" cx=\"94\" cy=\"18\" r=\"5.5\" fill=\"var(--pip-accent)\"/>\n        <circle cx=\"40\" cy=\"76\" r=\"11\" fill=\"var(--pip-dark)\"/><circle cx=\"40\" cy=\"76\" r=\"5.5\" fill=\"var(--pip-main)\"/>\n        <circle cx=\"128\" cy=\"76\" r=\"11\" fill=\"var(--pip-dark)\"/><circle cx=\"128\" cy=\"76\" r=\"5.5\" fill=\"var(--pip-main)\"/>\n        <rect x=\"38\" y=\"36\" width=\"92\" height=\"78\" rx=\"38\" fill=\"url(#pg-head)\"/>\n        <path d=\"M51 64 Q55 46 78 41\" stroke=\"#fff\" stroke-opacity=\".5\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/>\n        <rect x=\"50\" y=\"54\" width=\"68\" height=\"46\" rx=\"23\" fill=\"url(#pg-visor)\" stroke=\"#fff\" stroke-opacity=\".08\"/>\n        <path d=\"M60 65 Q70 58 87 58\" stroke=\"#fff\" stroke-opacity=\".22\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/>\n        <g class=\"eyes\">\n          <g class=\"eye\"><ellipse cx=\"70\" cy=\"77\" rx=\"6.5\" ry=\"8.5\" fill=\"url(#pg-eye)\"/><circle cx=\"68\" cy=\"73.5\" r=\"1.9\" fill=\"#fff\"/></g>\n          <g class=\"eye\"><ellipse cx=\"98\" cy=\"77\" rx=\"6.5\" ry=\"8.5\" fill=\"url(#pg-eye)\"/><circle cx=\"96\" cy=\"73.5\" r=\"1.9\" fill=\"#fff\"/></g>\n          <path class=\"happy\" d=\"M63.5 80 Q70 70 76.5 80\" stroke=\"var(--pip-eye)\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\"/>\n          <path class=\"happy\" d=\"M91.5 80 Q98 70 104.5 80\" stroke=\"var(--pip-eye)\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\"/>\n          <path class=\"mouth mouth-smile\" d=\"M78 90 Q84 95.5 90 90\" stroke=\"var(--pip-eye)\" stroke-width=\"2.6\" fill=\"none\" stroke-linecap=\"round\"/>\n          <path class=\"mouth mouth-focus\" d=\"M80 91 H88\" stroke=\"var(--pip-eye)\" stroke-width=\"2.6\" fill=\"none\" stroke-linecap=\"round\"/>\n        </g>\n        <ellipse cx=\"59\" cy=\"91\" rx=\"5\" ry=\"3\" fill=\"#ff6b8a\" opacity=\".3\"/>\n        <ellipse cx=\"109\" cy=\"91\" rx=\"5\" ry=\"3\" fill=\"#ff6b8a\" opacity=\".3\"/>\n\n        <!-- لابتوب -->\n        <g class=\"laptop\">\n          <g class=\"lid\">\n            <rect x=\"58\" y=\"140\" width=\"52\" height=\"38\" rx=\"5\" fill=\"url(#pg-lid)\"/>\n            <rect x=\"61\" y=\"143\" width=\"46\" height=\"32\" rx=\"3\" fill=\"url(#pg-screen)\"/>\n            <rect x=\"61\" y=\"143\" width=\"46\" height=\"32\" rx=\"3\" fill=\"url(#pg-sglow)\"/>\n            <rect class=\"code c1\" x=\"65\" y=\"147\" width=\"20\" height=\"3\" rx=\"1.5\" fill=\"#6ee7c8\"/>\n            <rect class=\"code c2\" x=\"65\" y=\"153\" width=\"30\" height=\"3\" rx=\"1.5\" fill=\"#a8ecff\"/>\n            <rect class=\"code c3\" x=\"69\" y=\"159\" width=\"22\" height=\"3\" rx=\"1.5\" fill=\"#9cc2ff\"/>\n            <rect class=\"code c4\" x=\"69\" y=\"165\" width=\"28\" height=\"3\" rx=\"1.5\" fill=\"#ffdf6e\"/>\n            <rect class=\"code c5\" x=\"65\" y=\"171\" width=\"16\" height=\"3\" rx=\"1.5\" fill=\"#c9a6ff\"/>\n            <rect class=\"cursor\" x=\"84\" y=\"170.5\" width=\"3\" height=\"4.5\" rx=\"1\" fill=\"#fff\"/>\n          </g>\n          <path d=\"M50 186 L57 177 H111 L118 186 Z\" fill=\"url(#pg-deck)\"/>\n          <rect x=\"62\" y=\"179.5\" width=\"44\" height=\"2\" rx=\"1\" fill=\"#8d98ac\" opacity=\".7\"/>\n          <rect x=\"50\" y=\"186\" width=\"68\" height=\"3\" rx=\"1.5\" fill=\"#8a95a9\"/>\n        </g>\n\n        <!-- يد أمامية -->\n        <g class=\"arm arm-r\"><rect x=\"109\" y=\"128\" width=\"13\" height=\"30\" rx=\"6.5\" fill=\"url(#pg-limb)\"/><circle cx=\"115.5\" cy=\"158\" r=\"7\" fill=\"var(--pip-main)\"/></g>\n      </g>\n    </svg>\n  </div>\n</div>";
    document.body.appendChild(holder.firstElementChild);
    
(() => {
  /* ============ إعدادات ============ */
  const CONFIG = Object.assign({
    speed: 80,                                   // سرعة المشي (بكسل/ثانية)
    greeting: 'هلا والله 👋',
    workMessages: ['أدوّر لك على عمل…', 'أراجع الترشيحات…', 'أجهّز لك الخيارات…'],
    restMessage: 'أبي أرتاح شوي…',
    doneMessage: 'تم ✓',
    avoid: ''                                    // سيليكتور عنصر ما يمشي تحته (مثل لوحة الشات)
  }, window.PIP_CONFIG || {});
  /* ================================= */

  const pip = document.getElementById('pip');
  pip.setAttribute('role', 'button');
  pip.setAttribute('aria-label', 'افتح مساعد المشاهدة');
  pip.tabIndex = 0;
  const flip = pip.querySelector('.flip');
  const bubble = document.getElementById('bubble');
  const btext = document.getElementById('btext');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse), (max-width: 740px)').matches;
  const FALL = 'bottom .45s cubic-bezier(.55,0,1,.6)';
  const ground = () => matchMedia('(max-width: 740px)').matches
    ? 'calc(88px + env(safe-area-inset-bottom, 0px))'
    : 'env(safe-area-inset-bottom, 0px)';
  const W = () => pip.offsetWidth;

  let gen = 0, dir = 1, manual = false, bubbleTimer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  function clampBubble() {
    bubble.style.marginLeft = '0px';
    const r = bubble.getBoundingClientRect();
    const shift = r.left < 8 ? 8 - r.left : r.right > innerWidth - 8 ? innerWidth - 8 - r.right : 0;
    bubble.style.marginLeft = shift + 'px';
  }
  function say(text, ms = 2200, busy = false) {
    clearTimeout(bubbleTimer);
    if (!text) { bubble.classList.remove('show'); return; }
    btext.textContent = text;
    bubble.classList.toggle('busy', busy);
    bubble.classList.add('show');
    clampBubble();
    if (ms) bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  function face(d) {
    dir = d; pip.style.setProperty('--dir', d);
    flip.style.transform = `scaleX(${d})`;
    bubble.style.left = d === 1 ? '42%' : '58%';
  }
  function bounds() {
    let max = Math.max(0, innerWidth - W());
    if (CONFIG.avoid) {
      const el = document.querySelector(CONFIG.avoid);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.left < innerWidth - 10 && getComputedStyle(el).visibility !== 'hidden')
          max = Math.min(max, r.left - W() - 8);
      }
    }
    return [0, Math.max(0, max)];
  }
  function halt() {                                // يوقف المشي في مكانه
    const r = pip.getBoundingClientRect();
    pip.style.transition = FALL;
    pip.style.left = r.left + 'px';
    pip.classList.remove('walk');
  }
  async function walkTo(x, g) {
    const cur = pip.getBoundingClientRect().left;
    const dist = Math.abs(x - cur);
    if (dist < 10) return;
    face(x > cur ? 1 : -1);
    const t = dist / CONFIG.speed;
    pip.classList.add('walk');
    pip.style.transition = `left ${t}s linear, ${FALL}`;
    pip.style.left = x + 'px';
    await sleep(t * 1000);
    if (g === gen) pip.classList.remove('walk');
  }

  async function routine(first = false) {
    if (reduceMotion || manual || document.hidden) return;
    const g = ++gen;
    pip.classList.remove('walk', 'sit', 'laptop-open');
    if (first) { await sleep(500); say(CONFIG.greeting, 2000); await sleep(1800); }
    while (g === gen) {
      const [minX, maxX] = bounds();
      await walkTo(rand(minX, maxX), g);            if (g !== gen) return;
      await sleep(500);                          if (g !== gen) return;
      say(CONFIG.restMessage);
      pip.classList.add('sit');
      await sleep(1000);                         if (g !== gen) return;
      pip.classList.add('laptop-open');
      for (const m of CONFIG.workMessages) {
        say(m, 0, true); await sleep(rand(2400, 3400));
        if (g !== gen) return;
      }
      say(CONFIG.doneMessage, 1600);
      pip.classList.remove('laptop-open');
      await sleep(900);                          if (g !== gen) return;
      pip.classList.remove('sit');
      await sleep(rand(900, 2200));              if (g !== gen) return;
    }
  }

  /* ============ السحب (ماوس + لمس) ============ */
  let drag = false, moved = false, sx, sy, sl, sb;
  pip.addEventListener('pointerdown', e => {
    drag = true; moved = false; sx = e.clientX; sy = e.clientY;
    const r = pip.getBoundingClientRect();
    sl = r.left; sb = innerHeight - r.bottom;
    pip.setPointerCapture(e.pointerId);
  });
  pip.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 6) {
      moved = true; gen++;
      pip.classList.remove('walk', 'sit', 'laptop-open');
      pip.classList.add('dragging');
      pip.style.transition = 'none';
      say('');
    }
    if (!moved) return;
    pip.style.left = Math.min(Math.max(0, sl + dx), innerWidth - W()) + 'px';
    pip.style.bottom = Math.min(Math.max(0, sb - dy), innerHeight - pip.offsetHeight) + 'px';
  });
  const release = async () => {
    if (!drag) return; drag = false;
    if (moved) {
      pip.classList.remove('dragging');
      pip.style.transition = FALL;
      pip.style.bottom = ground();
      await sleep(520);
      say('أوه، نزلت!', 1600);
      if (manual) { pip.classList.add('sit', 'laptop-open'); }
      else { await sleep(900); routine(); }
    } else {
      pip.classList.add('hop');
      window.dispatchEvent(new Event('pip:open-chat'));
      setTimeout(() => pip.classList.remove('hop'), 600);
    }
  };
  pip.addEventListener('pointerup', release);
  pip.addEventListener('pointercancel', () => {
    if (!drag) return;
    drag = false;
    pip.classList.remove('dragging');
    pip.style.transition = FALL;
    pip.style.bottom = ground();
    if (moved && !manual) routine();
  });
  pip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.dispatchEvent(new Event('pip:open-chat'));
    }
  });

  /* ============ العيون تتابع المؤشر ============ */
  let raf = 0;
  addEventListener('pointermove', e => {
    if (raf || drag || reduceMotion) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = pip.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width * (dir === 1 ? .42 : .58));
      const dy = e.clientY - (r.top + r.height * .38);
      const k = Math.min(1, Math.hypot(dx, dy) / 220), a = Math.atan2(dy, dx);
      pip.style.setProperty('--ex', (Math.cos(a) * 4 * k * dir).toFixed(2) + 'px');
      pip.style.setProperty('--ey', (Math.sin(a) * 3 * k).toFixed(2) + 'px');
    });
  }, { passive: true });

  /* ============ صيانة ============ */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { gen++; halt(); } else routine();
  });
  addEventListener('resize', () => {
    const max = Math.max(0, innerWidth - W());
    if (pip.getBoundingClientRect().left > max) { pip.style.transition = 'none'; pip.style.left = max + 'px'; }
    if (!drag) pip.style.bottom = ground();
    if (matchMedia('(max-width: 740px)').matches) {
      gen++;
      pip.classList.remove('walk', 'sit', 'laptop-open');
      say('');
    }
  });

  /* ============ واجهة التحكم من موقعك ============
     pip.start('جاري التحميل…')  يقعد ويفتح اللابتوب ويشتغل لين تنادي stop
     pip.stop('تم ✓')             يسكّر ويقوم ويرجع لروتينه
     pip.say('نص')                 يعرض رسالة
     pip.hide() / pip.show()                                  */
  window.pip = {
    say,
    start(text) {
      manual = true; gen++; halt(); say('');
      pip.classList.add('sit');
      setTimeout(() => { if (manual) { pip.classList.add('laptop-open'); say(text || 'يعمل…', 0, true); } }, 700);
    },
    async stop(text = CONFIG.doneMessage) {
      manual = false; gen++;
      pip.classList.remove('laptop-open'); say(text, 1800);
      await sleep(900); pip.classList.remove('sit');
      await sleep(900); routine();
    },
    async work(task, startText, doneText) {
      window.pip.start(startText);
      try { return await (typeof task === 'function' ? task() : task); }
      finally { window.pip.stop(doneText); }
    },
    hide() { gen++; halt(); pip.style.display = 'none'; },
    show() { if (document.body.classList.contains('pip-disabled')) return; pip.style.display = ''; routine(); }
  };

  /* بداية: يظهر من يسار الشاشة */
  face(1);
  pip.style.left = '16px';
  pip.style.bottom = ground();
  if (document.body.classList.contains('pip-disabled')) pip.style.display = 'none';
  else routine(true);
})();

  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

// Sweet Nothings Cakery: the cookie breaking open, the chocolate that pours out of it and runs down the whole page,
// and the interactive menu.
(function () {
  const WA = "https://wa.me/27848687123?text=";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const set = (n, attrs) => { for (const k in attrs) n.setAttribute(k, attrs[k]); };

  /* ---------- The cookie breaking open ---------- */
  // The clip, cut out of its background so the cookie and crumbs float on the page, is a run of transparent frames
  // (assets/frames/00.webp ... 55.webp). Scrolling through the opening draws them one by one.
  const FRAMES = 56;
  const CLIP_END = 0.72; // share of the opening's scroll spent breaking the cookie; the rest is the first pour
  // where the chocolate sags lowest in the last frame (share of the frame): the stream starts here
  const SPOUT = { x: 0.627, y: 0.752 };

  const hero = document.querySelector(".break");
  const pin = document.querySelector(".break__pin");
  const media = document.querySelector(".break__media");
  const canvas = document.querySelector(".break__canvas");
  const ctx = canvas.getContext("2d");
  const frames = new Array(FRAMES);
  let shown = -1, want = 0;

  function drawFrame(i) {
    // use the nearest frame that has arrived, so a slow connection still shows something
    for (let d = 0; d < FRAMES; d++) {
      const a = frames[i - d], b = frames[i + d];
      const im = (a && a.complete && a.naturalWidth) ? a : (b && b.complete && b.naturalWidth) ? b : null;
      if (im) {
        if (im === frames[shown]) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        shown = frames.indexOf(im);
        return;
      }
    }
  }
  function loadFrame(i) {
    const im = new Image();
    im.decoding = "async";
    im.src = "assets/frames/" + String(i).padStart(2, "0") + ".webp";
    im.onload = () => { if (Math.abs(i - want) <= Math.abs(shown - want) || shown < 0) drawFrame(want); };
    frames[i] = im;
  }
  // the first and last frames first, then everything in between
  [0, FRAMES - 1].forEach(loadFrame);
  for (let i = 1; i < FRAMES - 1; i++) loadFrame(i);

  /* ---------- The chocolate ---------- */
  // One stream of chocolate, shaded like the molten chocolate in the clip: a dark rim, the warm brown body,
  // a broad soft sheen down the lit side and a thin bright highlight. The colours are sampled from the clip.
  const C = { rim: "#2C1206", body: "#4B210D", sheen: "#8A4826", spec: "#FFE6CF" };

  function streamLayers(svg, id, w) {
    const g = mk("g", { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    const L = {
      shadow: mk("path", { stroke: "rgba(110,30,20,.14)", "stroke-width": w * 1.3, transform: "translate(" + w * 0.3 + "," + w * 0.5 + ")" }, g),
      rim: mk("path", { stroke: C.rim, "stroke-width": w }, g),
      body: mk("path", { stroke: C.body, "stroke-width": w * 0.86 }, g),
      sheen: mk("path", { stroke: C.sheen, "stroke-opacity": ".75", "stroke-width": w * 0.36, transform: "translate(" + (-w * 0.14) + "," + (-w * 0.04) + ")" }, g),
      spec: mk("path", { stroke: C.spec, "stroke-opacity": ".6", "stroke-width": Math.max(1.4, w * 0.1), transform: "translate(" + (-w * 0.22) + "," + (-w * 0.06) + ")" }, g)
    };
    // the leading drop: rounder and a touch wider than the stream, with a bright catchlight
    const head = mk("g", {}, svg);
    mk("ellipse", { rx: w * 0.6, ry: w * 0.68, fill: C.rim }, head);
    mk("ellipse", { rx: w * 0.5, ry: w * 0.58, fill: C.body }, head);
    mk("ellipse", { rx: w * 0.2, ry: w * 0.3, cx: -w * 0.16, cy: -w * 0.08, fill: C.sheen, "fill-opacity": ".8" }, head);
    mk("circle", { r: w * 0.09, cx: -w * 0.24, cy: -w * 0.2, fill: C.spec, "fill-opacity": ".8" }, head);
    return { L, head, g };
  }
  function setPath(s, d) { Object.values(s.L).forEach((p) => p.setAttribute("d", d)); }
  function reveal(s, total, shownLen, pt) {
    const off = Math.max(0, total - shownLen);
    Object.values(s.L).forEach((p) => { p.style.strokeDasharray = total + " " + (total + 10); p.style.strokeDashoffset = off; });
    s.g.style.visibility = shownLen > 0.5 ? "visible" : "hidden";
    s.head.style.visibility = shownLen > 0.5 ? "visible" : "hidden";
    if (pt) s.head.setAttribute("transform", "translate(" + pt.x.toFixed(1) + "," + pt.y.toFixed(1) + ")");
  }

  // The first pour, inside the opening: from the low point of the molten chocolate straight down to the bottom of
  // the screen. When the opening scrolls away, the stream down the page carries on from exactly where this one ends.
  const pourSvg = mk("svg", { class: "break__pour", "aria-hidden": "true", focusable: "false" }, pin);
  let pour, pourLen = 0, spout = { x: 0, y: 0 }, W0 = 0;
  const streamW = () => clamp(window.innerWidth * 0.024, 14, 34);

  function buildPour() {
    pourSvg.textContent = "";
    const pr = pin.getBoundingClientRect(), mr = media.getBoundingClientRect();
    spout = { x: mr.left - pr.left + SPOUT.x * mr.width, y: mr.top - pr.top + SPOUT.y * mr.height };
    set(pourSvg, { viewBox: "0 0 " + pr.width + " " + pr.height });
    const w = streamW();
    pour = streamLayers(pourSvg, "pour", w);
    // where the stream leaves the chocolate sheet it is wider, then settles to its own width
    const lip = mk("path", { fill: C.rim, d: "" }, pourSvg);
    const lipBody = mk("path", { fill: C.body, d: "" }, pourSvg);
    pour.lip = [lip, lipBody];
    const x = spout.x, y = spout.y, h = pr.height + 2;
    setPath(pour, "M" + x.toFixed(1) + "," + y.toFixed(1) + " L" + x.toFixed(1) + "," + h.toFixed(1));
    pourLen = h - y;
    const nk = (k) => "M" + (x - w * 1.5 * k).toFixed(1) + "," + (y - w * 0.4).toFixed(1) + " Q" + (x - w * 0.5 * k).toFixed(1) + "," + (y + w * 0.3).toFixed(1) + " " + (x - w * 0.5 * k).toFixed(1) + "," + (y + w * 2.4).toFixed(1) + " L" + (x + w * 0.5 * k).toFixed(1) + "," + (y + w * 2.4).toFixed(1) + " Q" + (x + w * 0.5 * k).toFixed(1) + "," + (y + w * 0.3).toFixed(1) + " " + (x + w * 1.5 * k).toFixed(1) + "," + (y - w * 0.4).toFixed(1) + " Z";
    lip.setAttribute("d", nk(1)); lipBody.setAttribute("d", nk(0.8));
  }
  function drawPour(p) {
    if (!pour) return;
    const g = reduceMotion ? 1 : smooth(CLIP_END - 0.03, 1, p);
    pour.lip.forEach((n) => { n.style.opacity = clamp(g * 6, 0, 1); });
    const len = g * pourLen;
    reveal(pour, pourLen, len, { x: spout.x, y: spout.y + len });
    pour.head.style.visibility = g > 0 && g < 0.999 ? "visible" : "hidden";
  }

  // The stream down the page: from the bottom of the opening it bends out to the edge, runs down beside each
  // section, sweeps across at every section's top to the other side, and pools at the very bottom of the page.
  const main = document.querySelector("main");
  const flowSvg = mk("svg", { class: "flow", "aria-hidden": "true", focusable: "false" }, main);
  let flow, flowLen = 0, lut = [], flowTop = 0;

  function buildFlow() {
    flowSvg.textContent = "";
    const W = main.clientWidth, H = main.scrollHeight;
    set(flowSvg, { viewBox: "0 0 " + W + " " + H, width: W, height: H });
    const w = streamW();
    const wrap = Math.min(1240, W - 48), gut = (W - wrap) / 2;
    const xl = Math.max(w * 0.7 + 4, gut * 0.5), xr = W - xl;
    const mt = main.getBoundingClientRect().top + window.scrollY;
    const top = (el) => el.getBoundingClientRect().top + window.scrollY - mt;
    const heroEnd = top(hero) + hero.offsetHeight;
    // the stream continues from the first pour, which ends straight below the spout
    const pr = pin.getBoundingClientRect();
    const x0 = pr.left + spout.x;
    const secs = ["#menu", "#how-to-order", "#nasreen", ".cta"].map((q) => document.querySelector(q)).filter(Boolean);
    const pts = [[x0, heroEnd]];
    const drips = [];
    let side = x0 > W / 2 ? xr : xl;
    const padTop = (el) => parseFloat(getComputedStyle(el).paddingTop) || 80;
    const padBottom = (el) => parseFloat(getComputedStyle(el).paddingBottom) || 60;
    // a sweep across: it eases out from one side and into the other, and sags a little in the middle like a ribbon
    // of chocolate does when it runs sideways; a few drops hang off its underside
    const sweep = (fromX, toX, y0, dy) => {
      const sag = Math.min(dy * 0.28, Math.abs(toX - fromX) * 0.05);
      for (let k = 1; k <= 22; k++) {
        const t = k / 22, e = t * t * (3 - 2 * t);
        pts.push([fromX + (toX - fromX) * e, y0 + (dy - sag) * (0.15 * t + 0.85 * e) + sag * Math.sin(Math.PI * t)]);
        if (k === 8 || k === 13 || k === 17) drips.push({ i: pts.length - 1, l: w * (k === 13 ? 2.6 : k === 8 ? 1.6 : 1.1) });
      }
    };
    const wander = (from, to) => {
      for (let yy = from + 40; yy < to; yy += 40) pts.push([side + (Math.sin(yy / 131) * 0.6 + Math.sin(yy / 53) * 0.25) * w * 0.5, yy]);
    };
    // into the menu: bend out to the nearest edge inside the menu's top margin, above its heading
    sweep(x0, side, heroEnd, padTop(secs[0]) * 0.62);
    for (let i = 1; i < secs.length; i++) {
      // each crossing straddles the edge between two sections, in the empty space either side of it,
      // so the chocolate runs over the edge and never across a heading
      const edge = top(secs[i]);
      const before = Math.min(padBottom(secs[i - 1]) * 0.75, 110), after = padTop(secs[i]) * 0.5;
      wander(pts[pts.length - 1][1], edge - before);
      const next = side === xr ? xl : xr;
      sweep(side, next, edge - before, before + after);
      side = next;
    }
    // down past the last sections to a small pool at the bottom
    const end = H - 26;
    wander(pts[pts.length - 1][1], end - 60);
    // it settles into a small pool, kept fully on screen
    const px = clamp(side, w * 2.6 + 6, W - w * 2.6 - 6);
    pts.push([px, end]);
    // a smooth curve through the points
    let d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + "," + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + "," + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
    }
    flow = streamLayers(flowSvg, "flow", w);
    setPath(flow, d);
    // how far along the stream each point is (for the drips)
    const along = [0];
    for (let i = 1; i < pts.length; i++) along.push(along[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const dg = mk("g", { "stroke-linecap": "round" }, flowSvg);
    flow.drips = drips.map((dr) => {
      const [x, y] = pts[dr.i];
      const g = mk("g", { transform: "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")" }, dg);
      const stem = [mk("path", { stroke: C.rim, "stroke-width": w * 0.42, fill: "none" }, g), mk("path", { stroke: C.body, "stroke-width": w * 0.3, fill: "none" }, g)];
      const bead = [mk("circle", { r: w * 0.3, fill: C.rim }, g), mk("circle", { r: w * 0.23, fill: C.body }, g), mk("circle", { r: w * 0.07, cx: -w * 0.08, cy: -w * 0.08, fill: C.spec, "fill-opacity": ".7" }, g)];
      return { at: along[dr.i], l: dr.l, stem, bead, g };
    });
    flow.alongScale = 1;
    // the pool it ends in
    flow.pool = mk("g", {}, flowSvg);
    mk("ellipse", { cx: px, cy: end + w * 0.2, rx: w * 2.4, ry: w * 0.75, fill: C.rim }, flow.pool);
    mk("ellipse", { cx: px, cy: end + w * 0.12, rx: w * 2.1, ry: w * 0.58, fill: C.body }, flow.pool);
    mk("ellipse", { cx: px - w * 0.7, cy: end - w * 0.02, rx: w * 0.9, ry: w * 0.16, fill: C.sheen, "fill-opacity": ".8" }, flow.pool);
    flowLen = flow.L.body.getTotalLength();
    flow.alongScale = flowLen / Math.max(1, along[along.length - 1]);
    // how far along the stream each height on the page is, so the stream's front can follow the scroll
    lut = [];
    for (let i = 0; i <= 600; i++) { const l = flowLen * i / 600; lut.push([flow.L.body.getPointAtLength(l).y, l]); }
    flowTop = mt;
  }
  function lenAt(y) {
    if (!lut.length || y <= lut[0][0]) return 0;
    let lo = 0, hi = lut.length - 1;
    if (y >= lut[hi][0]) return flowLen;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (lut[m][0] < y) lo = m; else hi = m; }
    const [y0, l0] = lut[lo], [y1, l1] = lut[hi];
    return l0 + (l1 - l0) * ((y - y0) / Math.max(1e-6, y1 - y0));
  }
  function drawFlow() {
    if (!flow) return;
    // the front of the chocolate runs a little ahead of the reader, about four-fifths of the way down the screen
    const front = reduceMotion ? 1e9 : window.scrollY - flowTop + window.innerHeight * 0.85;
    const l = lenAt(front);
    reveal(flow, flowLen, l, l > 0 && l < flowLen ? flow.L.body.getPointAtLength(l) : null);
    flow.head.style.visibility = l > 0.5 && l < flowLen - 1 ? "visible" : "hidden";
    flow.pool.style.opacity = l >= flowLen - 1 ? 1 : 0;
    flow.drips.forEach((dr) => {
      const k = clamp((l - dr.at * flow.alongScale) / (dr.l * 4), 0, 1);
      dr.g.style.visibility = k > 0 ? "visible" : "hidden";
      const len = dr.l * (0.25 + 0.75 * k);
      dr.stem.forEach((n) => n.setAttribute("d", "M0,0 L0," + len.toFixed(1)));
      dr.bead.forEach((n) => { const cy = parseFloat(n.getAttribute("data-cy") || n.getAttribute("cy") || 0); if (!n.hasAttribute("data-cy")) n.setAttribute("data-cy", cy); n.setAttribute("cy", (cy + len).toFixed(1)); });
    });
  }

  function updateHero() {
    const r = hero.getBoundingClientRect();
    const travel = Math.max(1, r.height - window.innerHeight);
    const p = clamp(-r.top / travel, 0, 1);
    hero.style.setProperty("--p", p.toFixed(4));
    want = reduceMotion ? FRAMES - 1 : Math.round(smooth(0.02, CLIP_END, p) * (FRAMES - 1));
    drawFrame(want);
    drawPour(p);
  }

  let ticking = false;
  function update() { ticking = false; updateHero(); drawFlow(); }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function rebuild() { buildPour(); buildFlow(); update(); }
  let lastW = 0, lastH = 0;
  function onResize() {
    // phones resize the page when the address bar hides; only rebuild when the layout really changes
    if (window.innerWidth !== lastW || main.scrollHeight !== lastH) { lastW = window.innerWidth; lastH = main.scrollHeight; rebuild(); }
    onScroll();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("load", onResize); // photos and fonts change the page's height
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  onResize();

  /* ---------- Menu ---------- */
  const items = {
    cc: { kind: "Cookie", name: "Chocolate Chip", line: "Golden, chewy, milk chocolate chips.", img: "assets/img/choc-chip.jpg", prices: ["<strong>R100</strong> per half dozen", "<strong>R180</strong> per dozen"], order: "Chocolate Chip Cookies" },
    dc: { kind: "Cookie", name: "Double Chocolate Chip", line: "Dark cocoa dough, chocolate chips all the way through.", img: "assets/img/double-choc.jpg", prices: ["<strong>R100</strong> per half dozen", "<strong>R180</strong> per dozen"], order: "Double Chocolate Chip Cookies" },
    rv: { kind: "Cookie", name: "Red Velvet Chocolate Chip", line: "Deep red, soft centre, white chocolate pieces.", img: "assets/img/red-velvet.jpg", prices: ["<strong>R100</strong> per half dozen", "<strong>R180</strong> per dozen"], order: "Red Velvet Chocolate Chip Cookies" },
    bb: { kind: "Bites", name: "Brownie Bites", line: "Fudgy squares with a crackly top, boxed to share.", img: "assets/img/brownie-bites.jpg", prices: ["Message us for sizes and prices"], order: "Brownie Bites" }
  };
  const stage = document.querySelector(".menu__stage");
  const el = {
    photo: document.getElementById("menu-photo"),
    kind: document.getElementById("menu-kind"),
    name: document.getElementById("menu-name"),
    line: document.getElementById("menu-line"),
    prices: document.getElementById("menu-prices"),
    order: document.getElementById("menu-order")
  };
  const picks = Array.from(document.querySelectorAll(".pick"));

  function show(id, animate) {
    const it = items[id];
    if (!it) return;
    el.photo.src = it.img;
    el.photo.alt = it.name;
    el.kind.textContent = it.kind;
    el.name.textContent = it.name;
    el.line.textContent = it.line;
    el.prices.innerHTML = it.prices.map((p) => "<li>" + p + "</li>").join("");
    el.order.href = WA + encodeURIComponent("Hi Nasreen! I'd like to order " + it.order + ".");
    picks.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.item === id)));
    if (animate && !reduceMotion) {
      stage.classList.remove("is-swapping");
      void stage.offsetWidth; // restart the animation
      stage.classList.add("is-swapping");
      el.photo.style.animation = "none";
      void el.photo.offsetWidth;
      el.photo.style.animation = "";
    }
  }
  picks.forEach((b) => b.addEventListener("click", () => show(b.dataset.item, true)));
  show("cc", false);
})();

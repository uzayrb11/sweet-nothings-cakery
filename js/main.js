// Sweet Nothings Cakery: the cookie break, the chocolate spills and the interactive menu.
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

  // Molten chocolate: shapes are blurred and re-sharpened so they flow into each other like liquid,
  // then lit, so the chocolate gets real thickness, soft shading and a wet shine.
  function moltenFilter(defs, id, blur, bump, height, gloss) {
    gloss = gloss || { k: 1, exp: 30 };
    const f = mk("filter", { id, x: "-20%", y: "-20%", width: "140%", height: "140%", "color-interpolation-filters": "sRGB" }, defs);
    mk("feGaussianBlur", { in: "SourceGraphic", stdDeviation: blur, result: "soft" }, f);
    mk("feColorMatrix", { in: "soft", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10", result: "goo" }, f);
    mk("feGaussianBlur", { in: "goo", stdDeviation: bump, result: "bump" }, f);
    const diff = mk("feDiffuseLighting", { in: "bump", surfaceScale: height, diffuseConstant: "1.155", "lighting-color": "#ffffff", result: "shade" }, f);
    mk("feDistantLight", { azimuth: "225", elevation: "60" }, diff); // flat areas keep their exact colour
    mk("feComposite", { in: "goo", in2: "shade", operator: "arithmetic", k1: "1", k2: "0", k3: "0", k4: "0", result: "lit" }, f);
    const spec = mk("feSpecularLighting", { in: "bump", surfaceScale: height, specularConstant: gloss.k, specularExponent: gloss.exp, "lighting-color": "#FFE9D8", result: "shine" }, f);
    mk("feDistantLight", { azimuth: "235", elevation: "30" }, spec); // a low light: shine only on the rounded edges
    mk("feComposite", { in: "shine", in2: "goo", operator: "in", result: "shineIn" }, f);
    mk("feComposite", { in: "lit", in2: "shineIn", operator: "arithmetic", k1: "0", k2: "1", k3: "0.9", k4: "0" }, f);
    return f;
  }

  /* ---------- The cookie break ---------- */
  const hero = document.querySelector(".break");
  const svg = document.querySelector(".break__svg");
  const COOKIE = "assets/img/cookie-break.png";
  const ratio = 720 / 672;

  // The crack through the cookie, top to bottom, in cookie units (-0.5..0.5).
  const crack = [];
  for (let v = -0.6; v <= 0.601; v += 0.03) crack.push([0.026 * Math.sin(v * 13) + 0.012 * Math.sin(v * 31 + 1.3), v]);
  const crackX = (v) => {
    for (let i = 1; i < crack.length; i++) {
      const [u0, v0] = crack[i - 1], [u1, v1] = crack[i];
      if (v <= v1) return u0 + (u1 - u0) * ((v - v0) / (v1 - v0));
    }
    return 0;
  };
  // Strands of chocolate across the break: where (v), how thick, and when each one snaps.
  // Thin ones go first; the molten centre stretches longest.
  const strands = [
    { v: -0.36, w: 0.014, snap: 0.18, sag: 0.3 }, { v: -0.29, w: 0.026, snap: 0.36, sag: 0.5 }, { v: -0.155, w: 0.044, snap: 0.66, sag: 0.35 },
    { v: -0.1, w: 0.03, snap: 0.46, sag: 0.6 }, { v: 0.0, w: 0.085, snap: 0.96, sag: 0.45 }, { v: 0.08, w: 0.06, snap: 0.86, sag: 0.25 },
    { v: 0.19, w: 0.038, snap: 0.58, sag: 0.55 }, { v: 0.25, w: 0.018, snap: 0.3, sag: 0.4 }, { v: 0.36, w: 0.022, snap: 0.24, sag: 0.35 }
  ];

  let W = 0, H = 0, s = 0, h = 0, cx = 0, cy = 0;
  let halves = [], goo, shadow, molten;

  function build() {
    svg.textContent = "";
    W = svg.clientWidth; H = svg.clientHeight;
    const phone = W < 960;
    s = phone ? Math.min(W * 0.78, H * 0.44) : Math.min(W * 0.34, H * 0.6);
    h = s * ratio;
    cx = phone ? W * 0.5 : W * 0.67;
    cy = phone ? H * 0.66 : H * 0.5;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const defs = mk("defs", {}, svg);
    molten = moltenFilter(defs, "molten", (s * 0.008).toFixed(2), (s * 0.005).toFixed(2), (s * 0.04).toFixed(2), { k: 1.5, exp: 22 });
    set(molten, { filterUnits: "userSpaceOnUse", x: cx - s * 1.2, y: cy - h * 0.9, width: s * 2.4, height: H });
    const sg = mk("radialGradient", { id: "shade" }, defs);
    mk("stop", { offset: "0", "stop-color": "#4A2C22", "stop-opacity": ".26" }, sg);
    mk("stop", { offset: "1", "stop-color": "#4A2C22", "stop-opacity": "0" }, sg);
    shadow = mk("ellipse", { fill: "url(#shade)" }, svg);
    halves = [-1, 1].map((d) => {
      const clip = mk("clipPath", { id: "half" + d }, defs);
      let dd = "M" + (d * s) + "," + (-h);
      crack.forEach(([u, v]) => { dd += " L" + (u * s).toFixed(1) + "," + (v * h).toFixed(1); });
      dd += " L" + (d * s) + "," + h + " Z";
      mk("path", { d: dd }, clip);
      const g = mk("g", {}, svg);
      mk("image", { href: COOKIE, x: -s / 2, y: -h / 2, width: s, height: h, "clip-path": "url(#half" + d + ")", preserveAspectRatio: "none" }, g);
      return { d, g };
    });
    goo = mk("g", { filter: "url(#molten)", fill: "#3F1D0D", stroke: "#3F1D0D", "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    draw();
  }

  const place = (t, x, y) => { const c = Math.cos(t.rot), n = Math.sin(t.rot); return [t.tx + c * x - n * y, t.ty + n * x + c * y]; };

  function draw() {
    if (!W) return;
    const p = parseFloat(hero.style.getPropertyValue("--p")) || 0;
    const open = reduceMotion ? 0.32 : smooth(0.02, 0.7, p);
    const pour = reduceMotion ? 0 : smooth(0.62, 1, p);
    const gap = open * s * 0.26;
    const T = halves.map((x) => ({ d: x.d, tx: cx + x.d * gap / 2, ty: cy + open * s * 0.03, rot: x.d * open * 0.11 }));
    halves.forEach((x, i) => x.g.setAttribute("transform", "translate(" + T[i].tx.toFixed(1) + "," + T[i].ty.toFixed(1) + ") rotate(" + (T[i].rot * 57.3).toFixed(2) + ")"));
    set(shadow, { cx, cy: cy + h * 0.5, rx: s * (0.62 + open * 0.24), ry: s * 0.075 });

    let out = "";
    const line = (x0, y0, x1, y1, w) => '<path d="M' + x0.toFixed(1) + "," + y0.toFixed(1) + " L" + x1.toFixed(1) + "," + y1.toFixed(1) + '" stroke-width="' + w.toFixed(1) + '"/>';
    const blob = (x, y, r) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" stroke="none"/>';
    const edge = (t, v, inset) => place(t, crackX(v) * s - t.d * inset, v * h);

    if (open > 0.004) {
      // the soft, molten face along each broken edge
      const ew = s * 0.032 * clamp(open * 7, 0, 1);
      T.forEach((t) => {
        // short overlapping dabs, thick in the middle and thin at the ends, so the face looks lumpy and wet
        for (let v = -0.36; v <= 0.39; v += 0.035) {
          const taper = Math.cos(((v - 0.015) / 0.38) * 1.45);
          const wob = 0.75 + 0.25 * Math.sin(v * 37 + t.d * 2) + 0.15 * Math.sin(v * 71);
          const w = ew * taper * wob;
          if (w < 1) continue;
          const [x0, y0] = edge(t, v, w * 0.1), [x1, y1] = edge(t, v + 0.035, w * 0.1);
          out += line(x0, y0, x1, y1, w);
        }
        // melted chips bulging out of the break
        [[-0.22, 0.9], [-0.05, 1.2], [0.12, 1], [0.27, 0.8]].forEach(([v, k]) => { const [x, y] = edge(t, v + t.d * 0.02, ew * 0.25); out += blob(x, y, ew * 0.62 * k); });
      });

      // strands: stretch and sag, thin out, snap, then hang as drips from both halves
      strands.forEach((st, i) => {
        const L = edge(T[0], st.v, 0), R = edge(T[1], st.v, 0);
        const base = st.w * s;
        if (open < st.snap) {
          const k = open / st.snap;
          const w = base * Math.pow(1 - k, 0.75) + s * 0.006 * (1 - k);
          const mx = (L[0] + R[0]) / 2, my = (L[1] + R[1]) / 2 + (R[0] - L[0]) * st.sag * k * k;
          out += '<path d="M' + L[0].toFixed(1) + "," + L[1].toFixed(1) + " Q" + mx.toFixed(1) + "," + my.toFixed(1) + " " + R[0].toFixed(1) + "," + R[1].toFixed(1) + '" fill="none" stroke-width="' + w.toFixed(1) + '"/>';
          out += blob(L[0], L[1], base * 0.5) + blob(R[0], R[1], base * 0.5);
          if (k > 0.55) out += blob(mx, my + w * 0.2, w * (0.55 + (k - 0.55) * 1.2)); // the bead gathering at the low point
        } else {
          const a = smooth(st.snap, Math.min(1, st.snap + 0.25), open);
          [L, R].forEach((P, j) => {
            const len = base * (1.2 + a * 2.4) * (j ? 0.85 : 1) + pour * s * st.w * 5;
            const r = base * (0.36 + a * 0.12);
            out += blob(P[0], P[1], base * 0.5) + line(P[0], P[1], P[0] + (j ? -1 : 1) * base * 0.2, P[1] + len, r * 1.1) + blob(P[0] + (j ? -1 : 1) * base * 0.2, P[1] + len, r * 1.15);
            // once it pours, drops let go and fall away down the page
            if (pour > 0 && st.w > 0.035) {
              const fall = Math.pow(clamp(pour * 1.25 - (i % 3) * 0.12, 0, 1), 1.7);
              if (fall > 0) out += blob(P[0] + (j ? -1 : 1) * base * 0.2, P[1] + len + fall * H, r * 0.95);
            }
          });
        }
      });
    }
    goo.innerHTML = out;
  }

  function updateHero() {
    const r = hero.getBoundingClientRect();
    const travel = Math.max(1, r.height - window.innerHeight);
    hero.style.setProperty("--p", clamp(-r.top / travel, 0, 1).toFixed(4));
    draw();
  }

  /* ---------- Chocolate spilling into the sections ---------- */
  // Each spill is a band of chocolate along the top of a section, with drips that run down as it scrolls in.
  const spills = Array.from(document.querySelectorAll("[data-spill]")).map((el, n) => ({ el, n, into: el.classList.contains("spill--into") }));
  const dripSets = [
    [[0.03, 30, 0.85], [0.1, 18, 0.45], [0.19, 38, 1], [0.3, 22, 0.6], [0.41, 30, 0.9], [0.5, 50, 1], [0.6, 24, 0.55], [0.7, 34, 0.8], [0.8, 20, 0.45], [0.88, 40, 1], [0.97, 24, 0.65]],
    [[0.05, 34, 1], [0.16, 22, 0.55], [0.27, 30, 0.8], [0.38, 20, 0.5], [0.5, 40, 1], [0.62, 24, 0.65], [0.73, 34, 0.9], [0.85, 22, 0.55], [0.95, 30, 0.75]]
  ];
  function buildSpill(sp) {
    const el = sp.el;
    el.textContent = "";
    const w = el.clientWidth || window.innerWidth;
    const k = clamp(w / 1440, 0.55, 1); // drips keep a good size on phones
    const VW = w / k, VH = sp.into ? 130 : 230;
    // a top spill hangs down from the section's top edge; the "into" spill rises up from it
    const top = sp.into ? 0 : -60;
    const svg = mk("svg", { viewBox: "0 " + top + " " + VW.toFixed(0) + " " + (VH - top), preserveAspectRatio: "xMidYMin meet", "aria-hidden": "true" }, el);
    svg.style.height = ((VH - top) * k).toFixed(0) + "px";
    svg.style.top = (sp.into ? -VH * k + 1 : top * k).toFixed(0) + "px";
    const defs = mk("defs", {}, svg);
    const f = moltenFilter(defs, "spill" + sp.n, 6, 4, 9);
    set(f, { filterUnits: "userSpaceOnUse", x: -40, y: top, width: VW + 80, height: VH - top + (sp.into ? 0 : 120) });
    const g = mk("g", { filter: "url(#spill" + sp.n + ")", fill: "#3A1D10", stroke: "#3A1D10", "stroke-linecap": "round" }, svg);
    sp.VW = VW; sp.g = g;
    // where the chocolate meets the section edge, a plain unlit strip hides the seam the lighting leaves there
    const seam = (y, hgt) => mk("rect", { x: -40, y, width: VW + 80, height: hgt, fill: "#3A1D10" }, svg);
    if (sp.into) {
      sp.wave = mk("path", {}, g);
      seam(VH - 24, 26);
    } else {
      seam(-60, 44);
      mk("path", { d: "M-40,-60 L" + (VW + 40) + ",-60 L" + (VW + 40) + ",30 C" + VW * 0.9 + ",44 " + VW * 0.8 + ",26 " + VW * 0.7 + ",38 C" + VW * 0.58 + ",50 " + VW * 0.48 + ",28 " + VW * 0.38 + ",40 C" + VW * 0.26 + ",52 " + VW * 0.14 + ",30 0,42 L-40,42 Z" }, g);
      sp.drips = dripSets[sp.n % dripSets.length].map(([x, dw, l]) => ({ x: x * VW, w: dw, l, stem: mk("path", { fill: "none", "stroke-width": dw * 0.62 }, g), bead: mk("circle", { r: dw * 0.56, stroke: "none" }, g) }));
    }
  }
  function updateSpills() {
    const vh = window.innerHeight;
    spills.forEach((sp) => {
      const r = sp.el.getBoundingClientRect();
      const d = reduceMotion ? 1 : clamp((vh - r.top) / (vh * 0.8), 0, 1);
      if (sp.d !== undefined && Math.abs(sp.d - d) < 0.002) return;
      sp.d = d;
      if (sp.into) {
        const y = 130 - (16 + d * 104);
        const VW = sp.VW;
        sp.wave.setAttribute("d", "M-40,170 L-40," + (y + 20) + " C" + VW * 0.12 + "," + (y - 10) + " " + VW * 0.24 + "," + (y + 30) + " " + VW * 0.38 + "," + (y + 8) + " C" + VW * 0.52 + "," + (y - 14) + " " + VW * 0.64 + "," + (y + 26) + " " + VW * 0.78 + "," + (y + 4) + " C" + VW * 0.88 + "," + (y - 10) + " " + VW * 0.95 + "," + (y + 14) + " " + (VW + 40) + "," + (y + 6) + " L" + (VW + 40) + ",170 Z");
        return;
      }
      sp.drips.forEach((dr) => {
        const len = 18 + d * dr.l * 150;
        dr.stem.setAttribute("d", "M" + dr.x.toFixed(1) + ",20 L" + dr.x.toFixed(1) + "," + len.toFixed(1));
        set(dr.bead, { cx: dr.x.toFixed(1), cy: (len + dr.w * 0.12).toFixed(1) });
      });
    });
  }
  function buildSpills() { spills.forEach((sp) => { sp.d = undefined; buildSpill(sp); }); updateSpills(); }

  let ticking = false;
  function update() { ticking = false; updateHero(); updateSpills(); }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  let lastW = 0;
  function onResize() {
    // phones resize the page when the address bar hides; only rebuild when the width really changes
    if (window.innerWidth !== lastW || !W) { lastW = window.innerWidth; build(); buildSpills(); }
    onScroll();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  onResize();
  update();

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

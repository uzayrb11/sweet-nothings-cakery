// Sweet Nothings Cakery: the cookie break clip, the chocolate spills and the interactive menu.
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
  // Scrolling through the opening plays the clip of the cookie splitting open, frame by frame.
  // The clip was cut where both halves are still in view, so it stops there.
  const hero = document.querySelector(".break");
  const video = document.querySelector(".break__video");
  let duration = 0, target = 0, seeking = false;

  function seek() {
    if (!duration || seeking) return;
    const t = Math.min(duration - 0.04, target);
    if (Math.abs(video.currentTime - t) < 0.02) return;
    seeking = true;
    video.currentTime = t;
  }
  video.addEventListener("seeked", () => { seeking = false; seek(); });
  video.addEventListener("loadedmetadata", () => {
    duration = video.duration || 0;
    if (reduceMotion) { video.currentTime = Math.max(0, duration - 0.04); return; }
    updateHero();
  });
  // some phones only show the first frame after the video has been asked to play once
  video.play().then(() => video.pause()).catch(() => {});
  if (video.readyState >= 1) video.dispatchEvent(new Event("loadedmetadata"));

  function updateHero() {
    const r = hero.getBoundingClientRect();
    const travel = Math.max(1, r.height - window.innerHeight);
    const p = clamp(-r.top / travel, 0, 1);
    hero.style.setProperty("--p", p.toFixed(4));
    if (reduceMotion) return;
    target = smooth(0.02, 0.92, p) * duration; // the split finishes just before the opening scrolls away
    seek();
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
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; buildSpills(); }
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

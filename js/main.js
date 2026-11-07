// Sweet Nothings Cakery: the cookie breaking open as you scroll, and the interactive menu.
(function () {
  const WA = "https://wa.me/27848687123?text=";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- The cookie breaking open ---------- */
  // The clip, cut out of its background so the cookie and crumbs float on the page, is a run of transparent frames
  // (assets/frames/00.webp ... 55.webp). Scrolling through the opening draws them one by one.
  const FRAMES = 56;
  const CLIP_END = 0.9; // share of the opening's scroll spent breaking the cookie; it then holds on the last frame

  const hero = document.querySelector(".break");
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

  function updateHero() {
    const r = hero.getBoundingClientRect();
    const travel = Math.max(1, r.height - window.innerHeight);
    const p = clamp(-r.top / travel, 0, 1);
    hero.style.setProperty("--p", p.toFixed(4));
    want = reduceMotion ? FRAMES - 1 : Math.round(smooth(0.02, CLIP_END, p) * (FRAMES - 1));
    drawFrame(want);
  }

  let ticking = false;
  function update() { ticking = false; updateHero(); }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  /* ---------- Menu ---------- */
  const items = {
    cc: { kind: "Cookie", name: "Chocolate Chip", line: "Golden, chewy, milk chocolate chips.", img: "assets/img/choc-chip.jpg", prices: ["<strong>R100</strong> per half dozen", "<strong>R180</strong> per dozen"], order: "Chocolate Chip Cookies" },
    dc: { kind: "Cookie", name: "Double Chocolate Chip", line: "Dark cocoa dough, chocolate chips all the way through.", img: "assets/img/double-choc.jpg", prices: ["<strong>R100</strong> per half dozen", "<strong>R180</strong> per dozen"], order: "Double Chocolate Chip Cookies" },
    rv: { kind: "Cookie", name: "Red Velvet Chocolate Chip", line: "Deep red, soft centre, white chocolate pieces.", img: "assets/img/red-velvet.jpg", prices: ["<strong>R100</strong> per half dozen", "<strong>R180</strong> per dozen"], order: "Red Velvet Chocolate Chip Cookies" },
    bb: { kind: "Bites", name: "Brownie Bites", line: "Fudgy squares with a crackly top, boxed to share.", img: "assets/img/brownie-bites.jpg", prices: ["<strong>R80</strong> a box of 32", "<strong>+R5</strong> for chocolate sauce"], order: "Brownie Bites" }
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

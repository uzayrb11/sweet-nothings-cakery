// Sweet Nothings Cakery: scroll-to-bake scenes and the interactive menu.
(function () {
  const WA = "https://wa.me/27848687123?text=";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll to bake ---------- */
  const scenes = Array.from(document.querySelectorAll("[data-scene]"));
  const rail = document.querySelector(".bake__rail");
  const bake = document.querySelector(".bake");
  const dots = scenes.map(() => {
    const li = document.createElement("li");
    rail.appendChild(li);
    return li;
  });

  const videos = scenes.map((s) => s.querySelector("video"));
  videos.forEach((v) => {
    if (!v) return;
    v.muted = true;
    if (reduceMotion) {
      v.loop = true;
      v.autoplay = true;
      v.play().catch(() => {});
      return;
    }
    // Some phones only allow seeking once a video has played: start and stop it once.
    v.addEventListener("loadedmetadata", () => {
      const p = v.play();
      if (p) p.then(() => v.pause()).catch(() => {});
    }, { once: true });
  });

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    let active = 0;
    scenes.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const travel = Math.max(1, r.height - vh);
      const p = clamp(-r.top / travel, 0, 1);
      s.style.setProperty("--p", p.toFixed(4));
      if (r.top <= vh * 0.5) active = i;
      const v = videos[i];
      if (v && !reduceMotion && v.duration) {
        const t = p * (v.duration - 0.05);
        if (Math.abs(v.currentTime - t) > 0.015) v.currentTime = t;
      }
    });
    dots.forEach((d, i) => {
      d.classList.toggle("on", i === active);
      d.classList.toggle("done", i < active);
    });
    const b = bake.getBoundingClientRect();
    rail.classList.toggle("is-hidden", b.bottom < vh * 0.6);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  videos.forEach((v) => v && v.addEventListener("loadedmetadata", onScroll));
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

// Sweet Nothings Cakery: the order form and its automatic quote.
//
// Pricing rules (from the menu):
// - Cookies (Chocolate Chip, Double Chocolate Chip, Red Velvet Chocolate Chip) come in half dozens:
//   R100 for 6, R180 for 12. Each flavour is priced on its own, so every full dozen of a flavour costs R180
//   and a leftover half dozen costs R100. 18 of one flavour = R180 + R100 = R280.
// - Minimum of 6 cookies per order.
// - Brownie bites have no fixed price yet: they go on the quote as "price confirmed by Nasreen".
// - Delivery or collection: any delivery fee is confirmed by Nasreen with the invoice.
(function () {
  const PRICES = { half: 100, dozen: 180 };
  const MIN_COOKIES = 6;
  const ITEMS = [
    { id: "cc", name: "Chocolate Chip", kind: "cookie" },
    { id: "dc", name: "Double Chocolate Chip", kind: "cookie" },
    { id: "rv", name: "Red Velvet Chocolate Chip", kind: "cookie" },
    { id: "bb", name: "Brownie Bites", kind: "bites" }
  ];

  // Price for n cookies of one flavour. n must be a multiple of 6.
  function cookiePrice(n) {
    if (!Number.isInteger(n) || n < 0 || n % 6 !== 0) throw new Error("Cookies come in sixes: " + n);
    return Math.floor(n / 12) * PRICES.dozen + (n % 12 === 6 ? PRICES.half : 0);
  }

  // The words for a cookie count, e.g. 18 -> "1 dozen + half dozen".
  function boxWords(n) {
    const d = Math.floor(n / 12), h = n % 12 === 6;
    const parts = [];
    if (d) parts.push(d + " dozen");
    if (h) parts.push("half dozen");
    return parts.join(" + ");
  }

  // qty: { cc: cookies, dc: cookies, rv: cookies, bb: boxes }
  function quote(qty) {
    const lines = [];
    let total = 0, cookies = 0, tbc = false;
    ITEMS.forEach((it) => {
      const n = qty[it.id] || 0;
      if (!n) return;
      if (it.kind === "cookie") {
        const price = cookiePrice(n);
        cookies += n; total += price;
        lines.push({ id: it.id, name: it.name, detail: n + " cookies (" + boxWords(n) + ")", price });
      } else {
        tbc = true;
        lines.push({ id: it.id, name: it.name, detail: n + (n === 1 ? " box" : " boxes"), price: null });
      }
    });
    const problems = [];
    if (!lines.length) problems.push("Choose at least one treat.");
    else if (cookies > 0 && cookies < MIN_COOKIES) problems.push("The minimum order is " + MIN_COOKIES + " cookies.");
    return { lines, total, cookies, tbc, ok: problems.length === 0, problems };
  }

  const api = { PRICES, MIN_COOKIES, ITEMS, cookiePrice, boxWords, quote };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  /* ---------- The form on the page ---------- */
  const form = document.getElementById("quote-form");
  if (!form) return;
  const rand = (n) => "R" + n.toLocaleString("en-ZA");
  const qty = { cc: 0, dc: 0, rv: 0, bb: 0 };
  const out = {
    lines: document.getElementById("quote-lines"),
    total: document.getElementById("quote-total"),
    note: document.getElementById("quote-note"),
    send: document.getElementById("quote-send"),
    problem: document.getElementById("quote-problem")
  };

  form.querySelectorAll("[data-qty]").forEach((row) => {
    const id = row.dataset.qty, step = Number(row.dataset.step), max = Number(row.dataset.max);
    const value = row.querySelector("output");
    const minus = row.querySelector("[data-dir='-1']"), plus = row.querySelector("[data-dir='1']");
    const label = row.dataset.unit;
    const render = () => {
      value.textContent = qty[id];
      value.setAttribute("aria-label", qty[id] + " " + label);
      minus.disabled = qty[id] <= 0;
      plus.disabled = qty[id] >= max;
      row.classList.toggle("is-picked", qty[id] > 0);
    };
    [minus, plus].forEach((b) => b.addEventListener("click", () => {
      qty[id] = Math.min(max, Math.max(0, qty[id] + Number(b.dataset.dir) * step));
      render(); update();
    }));
    render();
  });
  form.addEventListener("change", update);
  form.addEventListener("input", update);
  // until the order meets the rules, the button does nothing (keyboard included)
  out.send.addEventListener("click", (e) => { if (out.send.getAttribute("aria-disabled")) e.preventDefault(); });
  form.addEventListener("submit", (e) => { e.preventDefault(); if (!out.send.getAttribute("aria-disabled")) window.open(out.send.href, "_blank", "noopener"); });

  function update() {
    const q = quote(qty);
    const how = (form.querySelector("input[name='how']:checked") || {}).value || "collect";
    const name = (form.querySelector("#quote-name").value || "").trim();
    out.lines.innerHTML = q.lines.length
      ? q.lines.map((l) => "<li><span><strong>" + l.name + "</strong><small>" + l.detail + "</small></span><span>" + (l.price === null ? "Price on request" : rand(l.price)) + "</span></li>").join("")
      : '<li class="quote__empty">Add treats above to see your quote.</li>';
    out.total.textContent = rand(q.total);
    const notes = [];
    if (q.tbc) notes.push("Brownie bites are priced by Nasreen and added to your invoice.");
    if (how === "deliver") notes.push("Any delivery fee is added to your invoice.");
    out.note.textContent = notes.join(" ");
    out.problem.textContent = q.lines.length ? q.problems.join(" ") : "";
    // the WhatsApp message carries the whole order, so Nasreen can send the invoice straight away
    const msg = ["Hi Nasreen! I'd like to order:"]
      .concat(q.lines.map((l) => "- " + l.name + ": " + l.detail + (l.price === null ? " (price on request)" : " = " + rand(l.price))))
      .concat(["Quote total: " + rand(q.total) + (q.tbc ? " + brownie bites" : "") + (how === "deliver" ? " + delivery" : ""),
               how === "deliver" ? "I'd like it delivered." : "I'll collect.",
               name ? "Name: " + name : ""]).filter(Boolean).join("\n");
    out.send.href = "https://wa.me/27848687123?text=" + encodeURIComponent(msg);
    if (q.ok) out.send.removeAttribute("aria-disabled"); else out.send.setAttribute("aria-disabled", "true");
  }
  update();
})();

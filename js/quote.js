// Sweet Nothings Cakery: the order form and its automatic quote.
//
// Pricing rules:
// - Cookies (Chocolate Chip, Double Chocolate Chip, Red Velvet Chocolate Chip) come in half dozens:
//   R100 for 6, R180 for 12. Flavours can be mixed, so the price is worked out on all the cookies together:
//   6 Chocolate Chip + 6 Red Velvet is one dozen, R180. Every full dozen is R180 and a leftover half dozen is R100.
// - Minimum of 6 cookies when cookies are ordered.
// - Brownie bites: R80 a box of 32. Chocolate sauce is R5 extra per box.
// - Collection is free. Delivery in Joburg South (a small radius) is R50 and goes on the quote.
//   A courier further away is quoted by Nasreen, so it is not added to the total.
(function () {
  const PRICES = { half: 100, dozen: 180, brownieBox: 80, sauce: 5, delivery: 50 };
  const MIN_COOKIES = 6;
  const BITES_PER_BOX = 32;
  const ITEMS = [
    { id: "cc", name: "Chocolate Chip", kind: "cookie" },
    { id: "dc", name: "Double Chocolate Chip", kind: "cookie" },
    { id: "rv", name: "Red Velvet Chocolate Chip", kind: "cookie" },
    { id: "bb", name: "Brownie Bites", kind: "bites" }
  ];

  // Price for n cookies (any mix of flavours). n must be a multiple of 6.
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

  // qty: { cc: cookies, dc: cookies, rv: cookies, bb: boxes }, sauce: chocolate sauce on the brownie boxes
  // how: "collect" | "deliver" (Joburg South) | "courier"
  function quote(qty, sauce, how) {
    const lines = [];
    let total = 0, cookies = 0;
    ITEMS.filter((it) => it.kind === "cookie").forEach((it) => {
      const n = qty[it.id] || 0;
      if (!n) return;
      cookies += n;
      lines.push({ id: it.id, name: it.name, detail: n + " cookies", price: null, part: true });
    });
    if (cookies) {
      const price = cookiePrice(cookies);
      total += price;
      lines.push({ id: "cookies", name: "Cookies" + (lines.length > 1 ? ", mixed" : ""), detail: cookies + " cookies (" + boxWords(cookies) + ")", price, sum: true });
    }
    const boxes = qty.bb || 0;
    if (boxes) {
      const price = boxes * PRICES.brownieBox;
      total += price;
      lines.push({ id: "bb", name: "Brownie Bites", detail: boxes + (boxes === 1 ? " box" : " boxes") + " of " + BITES_PER_BOX, price });
      if (sauce) {
        total += boxes * PRICES.sauce;
        lines.push({ id: "sauce", name: "Chocolate sauce", detail: "on " + boxes + (boxes === 1 ? " box" : " boxes"), price: boxes * PRICES.sauce });
      }
    }
    if ((cookies || boxes) && how === "deliver") {
      total += PRICES.delivery;
      lines.push({ id: "delivery", name: "Delivery", detail: "Joburg South", price: PRICES.delivery });
    }
    if ((cookies || boxes) && how === "courier") lines.push({ id: "courier", name: "Courier", detail: "fee quoted by Nasreen", price: null });
    const problems = [];
    if (!cookies && !boxes) problems.push("Choose at least one treat.");
    else if (cookies > 0 && cookies < MIN_COOKIES) problems.push("The minimum order is " + MIN_COOKIES + " cookies.");
    return { lines, total, cookies, boxes, ok: problems.length === 0, problems };
  }

  const api = { PRICES, MIN_COOKIES, BITES_PER_BOX, ITEMS, cookiePrice, boxWords, quote };
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
    const sauceBox = form.querySelector("#quote-sauce");
    const how = (form.querySelector("input[name='how']:checked") || {}).value || "collect";
    const q = quote(qty, sauceBox && sauceBox.checked, how);
    if (sauceBox) sauceBox.closest(".quote__sauce").hidden = !qty.bb;
    const name = (form.querySelector("#quote-name").value || "").trim();
    out.lines.innerHTML = q.lines.length
      ? q.lines.map((l) => "<li" + (l.part ? ' class="is-part"' : "") + "><span><strong>" + l.name + "</strong><small>" + l.detail + "</small></span><span>" + (l.price === null ? "" : rand(l.price)) + "</span></li>").join("")
      : '<li class="quote__empty">Add treats above to see your quote.</li>';
    out.total.textContent = rand(q.total);
    const notes = [];
    if (q.cookies && q.lines.filter((l) => l.part).length > 1) notes.push("Flavours are mixed into dozens for the best price.");
    if (how === "courier") notes.push("Courier cost is added to your invoice.");
    out.note.textContent = notes.join(" ");
    out.problem.textContent = q.lines.length ? q.problems.join(" ") : "";
    // the WhatsApp message carries the whole order, so Nasreen can send the invoice straight away
    const msg = ["Hi Nasreen! I'd like to order:"]
      .concat(q.lines.map((l) => (l.part ? "  - " : "- ") + l.name + ": " + l.detail + (l.price === null ? "" : " = " + rand(l.price))))
      .concat(["Quote total: " + rand(q.total) + (how === "courier" ? " + courier" : ""),
               how === "deliver" ? "Please deliver (Joburg South)." : how === "courier" ? "Please send it with a courier." : "I'll collect.",
               name ? "Name: " + name : ""]).filter(Boolean).join("\n");
    out.send.href = "https://wa.me/27848687123?text=" + encodeURIComponent(msg);
    // proof of payment: the same order summary, so Nasreen can match the payment to the order
    const summary = q.lines.length ? q.lines.filter((l) => !l.part).map((l) => l.name + ": " + l.detail).join(", ") + ". Total " + rand(q.total) : "";
    const popText = "Hi Nasreen! Here's my proof of payment (attached)." + (summary ? " Order: " + summary + "." : "") + (name ? " Name: " + name + "." : "");
    const popWa = document.getElementById("pop-wa"), popEmail = document.getElementById("pop-email");
    if (popWa) popWa.href = "https://wa.me/27848687123?text=" + encodeURIComponent(popText);
    if (popEmail) popEmail.href = "mailto:sweetnothingscakery01@gmail.com?subject=" + encodeURIComponent("Proof of payment - Sweet Nothings order" + (name ? " - " + name : "")) + "&body=" + encodeURIComponent("Hi Nasreen,\n\nMy proof of payment is attached.\n\n" + (summary ? "Order: " + summary + "\n" : "") + (name ? "Name: " + name + "\n" : ""));
    if (q.ok) out.send.removeAttribute("aria-disabled"); else out.send.setAttribute("aria-disabled", "true");
  }
  update();
})();

// Sweet Nothings Cakery: the order form and its automatic quote.
//
// Pricing rules:
// - Cookies (Chocolate Chip, Double Chocolate Chip, Red Velvet Chocolate Chip) come in half dozens:
//   R100 for 6, R180 for 12. Flavours can be mixed, so the price is worked out on all the cookies together:
//   6 Chocolate Chip + 6 Red Velvet is one dozen, R180. Every full dozen is R180 and a leftover half dozen is R100.
// - Minimum of 6 cookies when cookies are ordered.
// - Brownie bites: R80 a box of 32. Chocolate sauce is R5 extra per box.
// - Collection is free.
// - Delivery in Joburg South, from 9 Berwyn Road, Evans Park: R30 for the first 3 km by road, then R5 for every
//   extra km (part of a km counts as a km), up to a 12-minute drive. Further than that: courier.
//   The customer finds their address on the map; the driving distance and time come from OpenStreetMap routing.
// - A courier further away is quoted by Nasreen, so it is not added to the total.
(function () {
  const PRICES = { half: 100, dozen: 180, brownieBox: 80, sauce: 5 };
  const DELIVERY = { base: 30, baseKm: 3, perKm: 5, maxMinutes: 12, from: { lat: -26.24523, lng: 28.00299 } };
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

  // Delivery fee for a road distance in km, or null if the drive is longer than the limit.
  function deliveryFee(km, minutes) {
    if (!(km >= 0) || minutes > DELIVERY.maxMinutes) return null;
    return DELIVERY.base + DELIVERY.perKm * Math.max(0, Math.ceil(km - DELIVERY.baseKm - 1e-9));
  }

  // qty: { cc: cookies, dc: cookies, rv: cookies, bb: boxes }, sauce: chocolate sauce on the brownie boxes
  // how: "collect" | "deliver" (Joburg South) | "courier"; trip: { km, minutes } once the address is found
  function quote(qty, sauce, how, trip) {
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
    let deliveryProblem = "";
    if ((cookies || boxes) && how === "deliver") {
      const fee = trip ? deliveryFee(trip.km, trip.minutes) : null;
      if (fee !== null) {
        total += fee;
        lines.push({ id: "delivery", name: "Delivery", detail: trip.km.toFixed(1) + " km · about " + Math.max(1, Math.round(trip.minutes)) + " min drive", price: fee });
      } else deliveryProblem = trip ? "That's more than a 12-minute drive from us. Please choose courier." : "Find your address on the map to work out delivery.";
    }
    if ((cookies || boxes) && how === "courier") lines.push({ id: "courier", name: "Courier", detail: "fee quoted by Nasreen", price: null });
    const problems = [];
    if (!cookies && !boxes) problems.push("Choose at least one treat.");
    else if (cookies > 0 && cookies < MIN_COOKIES) problems.push("The minimum order is " + MIN_COOKIES + " cookies.");
    if (deliveryProblem && (cookies || boxes)) problems.push(deliveryProblem);
    return { lines, total, cookies, boxes, ok: problems.length === 0, problems };
  }

  const api = { PRICES, DELIVERY, MIN_COOKIES, BITES_PER_BOX, ITEMS, cookiePrice, boxWords, deliveryFee, quote };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  /* ---------- The form on the page ---------- */
  const form = document.getElementById("quote-form");
  if (!form) return;
  const rand = (n) => "R" + n.toLocaleString("en-ZA");
  const qty = { cc: 0, dc: 0, rv: 0, bb: 0 };
  let trip = null, address = "";
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
    const q = quote(qty, sauceBox && sauceBox.checked, how, trip);
    const panel = document.getElementById("deliver");
    if (panel) { panel.hidden = how !== "deliver"; if (how === "deliver") openMap(); }
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
               how === "deliver" ? "Please deliver to: " + (address || "(address)") : how === "courier" ? "Please send it with a courier." : "I'll collect.",
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
  /* ---------- Delivery: the map and the address ---------- */
  // Leaflet and the map tiles come from OpenStreetMap; they only load once someone picks delivery.
  const D = DELIVERY.from;
  let map = null, pin = null, loading = null;
  const result = document.getElementById("deliver-result");
  const addrInput = document.getElementById("deliver-address");
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      js.onload = res; js.onerror = rej;
      document.head.appendChild(js);
    });
    return loading;
  }
  const dot = (cls, label) => window.L.divIcon({ className: "map-pin " + cls, html: "<span></span>" + (label ? "<b>" + label + "</b>" : ""), iconSize: [22, 22], iconAnchor: [11, 11] });
  function openMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 50); return; }
    loadLeaflet().then(() => {
      if (map) return;
      const L = window.L;
      map = L.map("deliver-map", { scrollWheelZoom: false }).setView([D.lat, D.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      L.marker([D.lat, D.lng], { icon: dot("map-pin--us", "Sweet Nothings"), keyboard: false }).addTo(map);
      // tapping the map puts the pin there (handy when the address search lands on the wrong spot)
      map.on("click", (e) => placePin(e.latlng.lat, e.latlng.lng, "the pin on the map"));
    }).catch(() => { document.getElementById("deliver-map").hidden = true; });
  }
  function placePin(lat, lng, label) {
    const L = window.L;
    if (!pin) {
      pin = L.marker([lat, lng], { icon: dot("map-pin--you", "You"), draggable: true }).addTo(map);
      pin.on("dragend", () => { const p = pin.getLatLng(); route(p.lat, p.lng, "the pin on the map"); });
    } else pin.setLatLng([lat, lng]);
    map.fitBounds(L.latLngBounds([[D.lat, D.lng], [lat, lng]]).pad(0.35), { maxZoom: 15 });
    route(lat, lng, label);
  }
  // the driving distance and time from the bakery, by road
  function route(lat, lng, label) {
    result.textContent = "Working out the distance…";
    if (label && label !== "the pin on the map") address = label;
    else if (!address) address = "pin at " + lat.toFixed(5) + ", " + lng.toFixed(5);
    const url = "https://router.project-osrm.org/route/v1/driving/" + D.lng + "," + D.lat + ";" + lng + "," + lat + "?overview=false";
    fetch(url).then((r) => r.json()).then((j) => {
      const r = j.routes && j.routes[0];
      if (!r) throw new Error("no route");
      setTrip(r.distance / 1000, r.duration / 60, false);
    }).catch(() => {
      // routing is down: estimate the road distance from the straight line (roads add about 40%)
      const R = 6371, t = (x) => x * Math.PI / 180;
      const h = Math.sin(t(lat - D.lat) / 2) ** 2 + Math.cos(t(D.lat)) * Math.cos(t(lat)) * Math.sin(t(lng - D.lng) / 2) ** 2;
      const km = 2 * R * Math.asin(Math.sqrt(h)) * 1.4;
      setTrip(km, km / 42 * 60, true);
    });
  }
  function setTrip(km, minutes, estimate) {
    trip = { km, minutes };
    const fee = deliveryFee(km, minutes);
    result.innerHTML = fee === null
      ? "<strong>" + km.toFixed(1) + " km, about " + Math.round(minutes) + " min away.</strong> That's further than we deliver. Please choose courier."
      : "<strong>" + km.toFixed(1) + " km, about " + Math.max(1, Math.round(minutes)) + " min away: delivery " + rand(fee) + ".</strong>" + (estimate ? " (estimated)" : "");
    result.classList.toggle("is-out", fee === null);
    update();
  }
  function findAddress() {
    const q = (addrInput.value || "").trim();
    if (!q) { addrInput.focus(); return; }
    result.textContent = "Looking up your address…";
    const query = /johannesburg|joburg|jhb/i.test(q) ? q : q + ", Johannesburg";
    // OpenStreetMap search, nudged towards Joburg South. It works even if the map itself hasn't loaded.
    fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=za&limit=1&viewbox=27.85,-26.15,28.20,-26.40&q=" + encodeURIComponent(query))
      .then((r) => r.json()).then((list) => {
        if (!list.length) { trip = null; result.textContent = "We couldn't find that address. Try your street and suburb, or tap your spot on the map."; update(); return; }
        const lat = +list[0].lat, lng = +list[0].lon;
        if (map) placePin(lat, lng, q); else route(lat, lng, q);
      }).catch(() => { result.textContent = "We couldn't look that up right now. Tap your spot on the map, or choose courier."; });
  }
  const findBtn = document.getElementById("deliver-find");
  if (findBtn) {
    findBtn.addEventListener("click", findAddress);
    addrInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); findAddress(); } });
    addrInput.addEventListener("input", () => { if (trip) { trip = null; result.textContent = "Tap Find to update the delivery fee."; update(); } });
  }
  const help = document.getElementById("deliver-help-btn");
  if (help) help.addEventListener("click", () => {
    const box = document.getElementById("deliver-help"), open = box.hidden;
    box.hidden = !open; help.setAttribute("aria-expanded", String(open));
  });

  update();
})();

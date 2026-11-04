# Sweet Nothings Cakery

The website for Sweet Nothings Cakery, a home bakery run by Nasreen: cookies, cookie bites, brownie bites and slabs.

A plain HTML, CSS and JavaScript site with no build step. Open `index.html` in a browser, or host the folder anywhere
(GitHub Pages, Netlify, Vercel, Lovable).

## What's on the page

- **Break it slowly**: the opening. As you scroll, Nasreen's double chocolate cookie (`assets/img/cookie-break.png`)
  pulls apart. Molten chocolate stretches across the break, thins, snaps and drips, then pours down the page.
- **Chocolate spills**: drips of chocolate run down into the top of the menu and the "Meet Nasreen" section, and a
  wave of chocolate rises into "How to order". Each one grows as its section scrolls into view.
- **Menu**: tap a treat to see its photo, prices and an "Order this on WhatsApp" button with the message pre-filled.
- **How to order**, **Meet Nasreen**, and the WhatsApp (084 868 7123) and Instagram (@sweetnothingscakery_) links.

## How the chocolate is drawn

The chocolate is drawn as SVG shapes in `js/main.js`, not as a video. Every shape goes through one filter
(`moltenFilter`), which blurs the shapes and sharpens them again so that they flow into each other like liquid. The
filter then lights them, so the chocolate looks thick and glossy.

- `strands`: where each strand of chocolate crosses the break, how thick it is and when it snaps.
- `dripSets`: where the drips hang in each section, how wide they are and how far they run.

People who have turned on "reduce motion" see the cookie already broken and the drips at full length.

## Editing prices and items

Menu items live in `js/main.js` (the `items` list) and in the buttons in `index.html` (`.pick`).

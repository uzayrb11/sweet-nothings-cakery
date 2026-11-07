# Sweet Nothings Cakery

The website for Sweet Nothings Cakery, a home bakery run by Nasreen: cookies, cookie bites, brownie bites and slabs.

A plain HTML, CSS and JavaScript site with no build step. Open `index.html` in a browser, or host the folder anywhere
(GitHub Pages, Netlify, Vercel, Lovable).

## What's on the page

- **Break it slowly**: the opening. As you scroll, a chocolate chip cookie splits open. It floats on the page with
  its crumbs: the clip was cut out of its background and saved as transparent frames (`assets/frames/00.webp` to
  `55.webp`), drawn one by one as you scroll. It stops while both halves are still in view.
- **Menu**: tap a treat to see its photo, prices and an "Order this on WhatsApp" button with the message pre-filled.
- **How to order**, **Meet Nasreen**, and the WhatsApp (084 868 7123) and Instagram (@sweetnothingscakery_) links.

People who have turned on "reduce motion" see the cookie already broken.

## Colours and type

Deep page pink `#FAD4DC`, burgundy `#7D1619` for headlines and buttons, the logo's pink `#F88EA4` for small accents.
Headlines in Playfair Display, accent words in Alex Brush, labels in Nunito Sans, everything else in DM Sans.

## Editing prices and items

Menu items live in `js/main.js` (the `items` list) and in the buttons in `index.html` (`.pick`).

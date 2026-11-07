# Sweet Nothings Cakery

The website for Sweet Nothings Cakery, a home bakery run by Nasreen: cookies, cookie bites, brownie bites and slabs.

A plain HTML, CSS and JavaScript site with no build step. Open `index.html` in a browser, or host the folder anywhere
(GitHub Pages, Netlify, Vercel, Lovable).

## What's on the page

- **Break it slowly**: the opening. As you scroll, a chocolate chip cookie splits open. It floats on the page with
  its crumbs: the clip was cut out of its background and saved as transparent frames (`assets/frames/00.webp` to
  `55.webp`), drawn one by one as you scroll. It stops while both halves are still in view.
- **Menu**: tap a treat to see its photo, prices and an "Order this on WhatsApp" button with the message pre-filled.
- **Build your order**: under the menu, customers pick how many of each treat they want and get an automatic quote.
  The button sends the whole order, with the total, to Nasreen on WhatsApp.
- **How to order**, **Meet Nasreen**, and the WhatsApp (084 868 7123) and Instagram (@sweetnothingscakery_) links.

People who have turned on "reduce motion" see the cookie already broken.

## Colours and type

Deep page pink `#FAD4DC`, burgundy `#7D1619` for headlines and buttons, the logo's pink `#F88EA4` for small accents.
Headlines in Playfair Display, accent words in Alex Brush, labels in Nunito Sans, everything else in DM Sans.

## Quote pricing rules

The rules live at the top of `js/quote.js`:

- Cookies are sold in half dozens: R100 for 6, R180 for 12. Flavours can be mixed, so the price is worked out on
  all the cookies together (6 Chocolate Chip + 6 Red Velvet = one dozen, R180).
- Minimum 6 cookies when cookies are ordered.
- Brownie bites: R80 a box of 32; chocolate sauce R5 extra per box.
- Collection is free. Delivery in Joburg South, measured by road from 9 Berwyn Road, Evans Park: R30 for the first
  3 km, then R5 per extra km, up to 6 km by road (R45 at most). The customer finds their address on a map
  (OpenStreetMap search and routing, no keys needed) and the fee is added to the quote. A courier further
  away is quoted by Nasreen and is not added to the total.
- Payment confirms the order: customers send proof of payment by WhatsApp (084 868 7123) or email
  (sweetnothingscakery01@gmail.com); both buttons carry the order summary.

## Editing prices and items

Menu items live in `js/main.js` (the `items` list) and in the buttons in `index.html` (`.pick`). Quote prices live in
`js/quote.js` (`PRICES`), and the order form rows in `index.html` (`.qrow`).

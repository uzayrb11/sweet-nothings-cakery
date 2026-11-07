# Sweet Nothings Cakery

The website for Sweet Nothings Cakery, a home bakery run by Nasreen: cookies, cookie bites, brownie bites and slabs.

A plain HTML, CSS and JavaScript site with no build step. Open `index.html` in a browser, or host the folder anywhere
(GitHub Pages, Netlify, Vercel, Lovable).

## What's on the page

- **Break it slowly**: the opening. As you scroll, a clip of a chocolate chip cookie splitting open
  (`assets/video/cookie-break.mp4`) plays frame by frame. It is cut to stop while both halves are still in view;
  then drips run out of the chocolate in the clip, over the edge of the frame and down into the page.
- **Chocolate spills**: drips of chocolate run down into the top of the menu and the "Meet Nasreen" section, and a
  wave of chocolate rises into "How to order". Each one grows as its section scrolls into view.
- **Menu**: tap a treat to see its photo, prices and an "Order this on WhatsApp" button with the message pre-filled.
- **How to order**, **Meet Nasreen**, and the WhatsApp (084 868 7123) and Instagram (@sweetnothingscakery_) links.

## How the chocolate is drawn

The opening clip is a video. The chocolate pouring out of it and spilling into the sections is drawn as SVG shapes in
`js/main.js` and filled with real chocolate cut from the clip's last frame (`assets/img/choc-texture.jpg`), so it has
the same colour, streaks and shine. Every shape goes through one filter
(`moltenFilter`), which blurs the shapes and sharpens them again so that they flow into each other like liquid. The
filter then lights them, so the chocolate looks thick and glossy.

- `pours`: where each drip leaves the chocolate in the clip's last frame, how wide and how long it is.
- `dripSets`: where the drips hang in each section, how wide they are and how far they run.

People who have turned on "reduce motion" see the last frame of the clip (the cookie broken open) and the drips at full length.

## Colours and type

Deep page pink `#FAD4DC`, burgundy `#7D1619` for headlines and buttons, the logo's pink `#F88EA4` for small accents.
Headlines in Playfair Display, accent words in Alex Brush, labels in Nunito Sans, everything else in DM Sans.

## Editing prices and items

Menu items live in `js/main.js` (the `items` list) and in the buttons in `index.html` (`.pick`).

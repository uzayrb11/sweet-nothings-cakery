# Sweet Nothings Cakery

The website for Sweet Nothings Cakery, a home bakery run by Nasreen: cookies, cookie bites, brownie bites and slabs.

A plain HTML, CSS and JavaScript site with no build step. Open `index.html` in a browser, or host the folder anywhere
(GitHub Pages, Netlify, Vercel, Lovable).

## What's on the page

- **Scroll to bake**: as you scroll, the bake plays out one step at a time. Each clip in `assets/video` plays
  forward with the scroll (and backwards when you scroll up).
- **Menu**: tap a treat to see its photo, prices and an "Order this on WhatsApp" button with the message pre-filled.
- **How to order**, **Meet Nasreen**, and the WhatsApp (084 868 7123) and Instagram (@sweetnothingscakery_) links.

## Adding the clips still to come

The chocolate, whisk and "break" clips aren't made yet. When they are:

1. Cut out the background so the clip sits on the page's blush pink (`#FEF2F2`), and encode it so it can be scrubbed:
   `ffmpeg -i in.mp4 -an -vf scale=960:-2 -c:v libx264 -crf 24 -g 2 -pix_fmt yuv420p -movflags +faststart out.mp4`
2. Put it in `assets/video/` with a poster frame.
3. Copy one of the video scenes in `index.html` (there's a note where they go) and change its number, title and line.

## Editing prices and items

Menu items live in `js/main.js` (the `items` list) and in the buttons in `index.html` (`.pick`).

# H5 Mobile Test Guide

If your phone and computer are on the same Wi-Fi:

1. Start a local static server in the `outputs` folder.
2. Open the computer's LAN URL on your phone, such as `http://192.168.1.23:8787`.

If your phone is not on the same LAN, use one of these public access options:

## Option A: Deploy as a static site

This prototype is fully static. Upload these files to any static hosting service:

- `index.html`
- `styles.css`
- `app.js`
- `science-lenses.json`

Good choices:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

After deployment, open the public HTTPS URL on your phone.

## Option B: Use a temporary tunnel

Run a tunnel tool on your computer to expose the local server as a temporary HTTPS URL.

Common choices:

- ngrok
- cloudflared tunnel
- localtunnel

This is fastest for quick phone testing, but the URL is temporary.

## Option C: Send the folder to a server

Copy the same four files to any server that can serve static files over HTTPS.

## Recommendation

For quick visual testing, use a temporary tunnel.

For repeated sharing with others, deploy it as a static site.

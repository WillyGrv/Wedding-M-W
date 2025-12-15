## Repo quick brief

This is a small, static wedding site (HTML/CSS/vanilla JS). There is no build tool or server in the repo — open `index.html` in a browser or serve the folder with a simple static HTTP server for local preview.

## What an AI assistant should know (short)

- The site is purely client-side and lives at the root: `index.html` loads `style.css` and `script.js`.
- Visual assets are in the `images/` folder (PNG/JPG/EPS/AI). CSS references these directly (see large decorative backgrounds in `style.css`).
- `script.js` contains page behaviors: intro overlay timing, countdown target date (2026-08-09T15:00), smooth scroll that subtracts the nav height, simple lazy-loading support (commented instruction to use `data-src`), and small UI effects (parallax, intersection observer animations).

## Patterns & conventions to follow when editing^

- Keep wedding-specific content obvious and easy to change: date/time is hardcoded in `script.js` (update there if needed). Avoid scattering that value in multiple files.
- Lazy-load images by using `data-src` and a placeholder `src` (see comments in `script.js`). If adding new large images, prefer this pattern to avoid layout jank.
- Animations are CSS-first; JS toggles classes or inlines styles. If adding timed animations, prefer CSS keyframes and small JS only for toggling classes.
- CSS variables are defined in `:root` in `style.css` (colors). Use these variables for consistent theming rather than hardcoding colors.

## Important files to inspect when asked

- `index.html` — page structure, sections (#accueil, #rsvp, #logements, #cagnotte), external RSVP link (Google Forms), and script include order.
- `script.js` — all interactive logic (countdown, scroll behavior, lazy-loading hint, intro overlay timeout). Example: update countdown date in this file.
- `style.css` — theme variables, large decorative image references (e.g. `.hero-bg-blur`, `.rsvp::before`) and responsive breakpoints.

## Common edits and examples

- Changing the wedding date: edit the ISO string in `script.js` near the top of the countdown section.
- Adding a new hero image: place it in `images/` and reference it in `style.css` (watch decorative absolute positioning and opacity). Use `data-src` + placeholder if large.
- External links: RSVP uses a Google Form — this is an external dependency; keep target `_blank` and `rel="noopener"` when adding links.

## Testing / Previewing

- Quick preview: open `index.html` in the browser or run a simple HTTP server from the repo root (preferred for relative asset loading).
- There are no automated tests in this repo. Verify changes visually across mobile and desktop breakpoints (CSS contains responsive rules at 1024px and 768px).

## Do not change without asking

- Avoid removing or renaming images in `images/` without checking CSS references — many large decorative assets are referenced by filename.
- Don't change the Google Fonts link in `index.html` unless intentional; fonts affect layout and spacing.

## If you need to add features

- Keep the site static (no server-side changes). If you add JS modules, keep them small and import via `<script type="module">` or keep a single `script.js` for simplicity.
- Document any added files in a short README at the repo root.

---
If anything here looks incomplete or you'd like more detail (preview commands, suggested local server command, or extra examples), tell me what to expand and I'll update this file.

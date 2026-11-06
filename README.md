# Brindahl — Imperial Archives

Mobile-first React 19 / Vite 6 implementation of the approved four-panel design.

## Development

```sh
npm ci
npm run dev
npm run build
```

The production entry is `index.html`. Routes use hashes, so dossier links work on a static Vercel deployment without rewrite rules. Fonts are self-hosted. No external runtime font or image requests are needed.

## Current review stage

The landing page and both dossiers use approved master artwork. The owner authorized cropping, masking, and publishing the resulting assets on this review branch. The hero keeps the planet, couple, nameplates, and seal together. The biographies, navigation, and actions are HTML. Both characters link to their dossiers.

The extraction recipe is in `scripts/extract-approved-art.py`. Source bounds, masks, and the master checksum are in `public/artwork/provenance.json`. Run the script with the supplied APPROVED_MASTER.png to reproduce the assets.

Use `tests/responsive.html` during development to inspect 375, 390, and 430 px phone layouts. See `design-qa.md` for the current artwork review.

## Scope and release

Guestbook data collection, uploads, moderation, authentication, and service provisioning belong to Phase 3. This build collects no guest information. The QR reference is decorative; production QR encoding and phone scan testing belong to Phase 4.

Review on a feature-branch Vercel preview. Keep `main` and the existing production site unchanged until approved. The repo retains JSX/CSS; no stack migration.

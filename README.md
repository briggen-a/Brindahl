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

Phase 1 layout and interaction foundation. **Visual fidelity is not complete or approved.** The supplied images are flattened references, not isolated assets. The app deliberately displays labeled slots for missing art. It does not display the reference screenshots as its interface, recreate the planet/people in CSS, or generate replacement imagery.

- The attached handoff’s `approved_assets/references/APPROVED_MASTER.png` remains the authoritative visual reference. Reference artwork is not included in this public branch.
- The supplied handoff defines the scope and approval gates; keep the original attachment with the design files.
- `src/content.js`: handoff copy and approved-art integration slots.
- `src/components.jsx`: reusable framing, navigation, asset slots, accessible dialogs.
- `src/App.jsx`: landing, Duke, Duchess, unopened registry, and basic secrets.
- `tests/responsive.html`: dev-only 375/390/430 px iframe review harness; not a Vite production entry.
- `design-qa.md`: review evidence and remaining visual blockers.

## Required before artwork integration

Supply approved standalone planetary scenery, full-length Duke and Duchess photos/cutouts, dossier portraits, and the transparent/vector B/K seal. The Bishop/Avelis scene layers are also absent. Preserve the approved composition. Any tracing, retouching, extraction, new art, or material design deviation needs the owner's approval first.

## Scope and release

Guestbook data collection, uploads, moderation, authentication, and service provisioning belong to Phase 3. This build collects no guest information. The QR reference is decorative; production QR encoding and phone scan testing belong to Phase 4.

Review on a feature-branch Vercel preview. Keep `main` and the existing production site unchanged until approved. The repo retains JSX/CSS; no stack migration.

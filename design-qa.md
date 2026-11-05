# Phase 1 design review

final result: blocked

This is a layout and interaction foundation, not an approved visual implementation. The missing production artwork prevents a faithful visual comparison from passing. Keep this change in draft review and do not merge it as the finished design.

## Sources and scope

- Visual authority: the supplied handoff's `approved_assets/references/APPROVED_MASTER.png` (1536 × 1024), inspected with all supplied reference crops.
- Requirements: `BRINDAHL_CODEX_HANDOFF.md`, package README, and asset manifest.
- Implementation: `src/App.jsx`, `src/components.jsx`, `src/content.js`, and `style.css` on `codex/phase-1-approved-layout`.
- Existing React/Vite stack retained. No replacement artwork generated. The reference artwork has not been published in this public branch.
- Guestbook collection/moderation and functional QR production remain later phases.

## Visual comparison

Local browser screenshots were inspected alongside the approved master. Review covered the landing page, Duke dossier, Duchess dossier, guestbook state, and secrets state. Only the first three have corresponding approved application panels; the fourth reference panel is the later seal/QR deliverable.

| Surface | Current state | Remaining difference |
| --- | --- | --- |
| Landing | Title, tagline, paired character links, seal slot, guestbook CTA, four navigation items | Planet, scenery, full-length figures, ornate seal, texture, and lighting are absent. Typography and framing are provisional. |
| Duke | Portrait slot beside identity; overlapping biography; exploits; scene slot and dossier links | Portrait and Bishop scenery absent. Frame and type treatment need comparison after asset integration. |
| Duchess | Portrait slot beside identity; biography; at-a-glance facts; quote; scene slot | Portrait and Avelis scenery absent. Final density and composition need asset-based review. |
| Guestbook | Explicit unopened registry state, no collection of visitor data | Functional guestbook belongs to Phase 3. |
| Secrets | Mock scan response and Bishop story dialog | Interaction foundation only; no biometric collection. |

The initial local review led to adjustments to title scale and dossier typography. Subsequent home and Duke screenshots were checked at 375, 390, and 430 px iframe widths. These changes improve hierarchy but do not establish visual equivalence with the source.

## Verification

- Baseline and revised `npm run build` passed.
- Local browser review used 375 × 812, 390 × 844, and 430 × 932 iframe viewports in `tests/responsive.html`. Home and Duke had no horizontal page overflow; dossiers scroll vertically.
- Verified landing-to-Duke navigation, Duke-to-Duchess navigation, return home, guestbook CTA, and secrets navigation.
- Verified mock scan response, Bishop dialog opening, five keyboard activations of the planet trigger, Escape dismissal, and focus return to the trigger.
- No relevant application console errors were observed during those checks.
- Physical phone testing, complete keyboard/accessibility review, menu smoke testing, reload/history checks, and final artwork fidelity remain pending. Five physical taps were not tested.
- Vercel reported the branch preview ready. Opening its URL reached Vercel authentication, so deployed-page visual verification was not completed. Local browser checks must not be represented as verification of the authenticated deployment.

Preview: https://brindahl-imperial-archives-am5vb2lnn-brigatwood-5815s-projects.vercel.app

Draft review: https://github.com/briggen-a/Brindahl/pull/1

## Required next inputs and decisions

Provide approved standalone planetary scenery, full-length Duke and Duchess images, dossier portraits, transparent/vector B/K seal, and Bishop/Avelis scene artwork. The supplied flattened reference crops are insufficient for a layered responsive implementation. Any extraction, retouching, substitution, or significant visual departure needs owner approval.

Automatic approval review rejected publication of a supplied reference image to the public GitHub repository; no reference images were uploaded. It also rejected creation of a seven-day no-login Vercel share link because that link would grant access to anyone holding it. The existing preview still requires Vercel sign-in. Main and production remain unchanged.

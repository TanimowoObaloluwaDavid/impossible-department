# The Impossible Department

An office that cannot be reached, cannot be closed, and cannot be removed from the record.

A deliberately hostile single-page React site: a form that rejects correct answers, a
prophecy engine that forecasts events that already happened, a queue that loads forever,
and a physics panel where the floor is optional.

## Stack

- Vite 8 + React 19 + TypeScript (strict, `verbatimModuleSyntax`)
- `oxlint` for linting
- No runtime dependencies beyond React
- Seeded, deterministic PRNG (`src/lib/rng.ts`) so the bureaucracy is reproducible

## Sections

| Anchor            | What it does                                                                  |
| ----------------- | ----------------------------------------------------------------------------- |
| `#petition`       | Form 7-B. Name validation runs in reverse; legible names are grounds for denial. |
| `#prophecy`       | Predictive apparatus with self-voiding clauses.                                |
| `#queue`          | Infinite-load table via `IntersectionObserver`, progress capped near 97%.      |
| `#physics`        | Pointer-driven 3D tilt, two boxes that disagree about which is above.         |
| `#fine-print`     | Clauses, live session tally, and a verdict derived from your submissions.      |

There is also a "Tilt the building" control in the nav that rotates the entire document.

## Run it

```bash
npm install
npm run dev      # dev server
npm run lint     # oxlint
npm run build    # tsc -b && vite build
npm run preview  # serve the production build
```

## Deploy

`.github/workflows/deploy.yml` builds on push to `main` and publishes to GitHub Pages.
The Vite `base` is set to `./`, so the build works from any path — user/org Pages
included. After the first successful run, enable Pages with source **GitHub Actions**.
# presentations

Standalone HTML slide decks for conference talks.

## Talks

| Event | Path | URL |
|-------|------|-----|
| AWS Community Day DACH 2026 | [`aws-community-day-dach-2026/`](aws-community-day-dach-2026/) | https://mmuller88.github.io/presentations/aws-community-day-dach-2026/ |
| ServerlessDays Milan 2026 | [`milan-2026-ai-factory/`](milan-2026-ai-factory/) | https://mmuller88.github.io/presentations/milan-2026-ai-factory/ |
| AI Builder Community Intro | [`ai-builder-intro/`](ai-builder-intro/) | https://mmuller88.github.io/presentations/ai-builder-intro/ |
| KI Stammtisch (Talk) | [`ki-stammtisch/`](ki-stammtisch/) | https://mmuller88.github.io/presentations/ki-stammtisch/ |

## Conventions

- One folder per talk: `event-slug/`
- Entry point: `index.html` (Reveal.js + Tailwind CDN, no build step)
- Assets in `assets/` (diagrams, screenshots only)
- Local preview:

```bash
cd <talk-folder>
python3 -m http.server 8080
```

## GitHub Pages

Enable once after merge: **Settings → Pages → Deploy from branch `main` / root**.

URL: `https://mmuller88.github.io/presentations/<talk-folder>/`

# presentations

Standalone HTML slide decks for conference talks.

## Talks

| Event | Path | URL |
|-------|------|-----|
| ServerlessDays Milan 2026 | [`milan-2026-ai-factory/`](milan-2026-ai-factory/) | https://mmuller88.github.io/presentations/milan-2026-ai-factory/ |

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

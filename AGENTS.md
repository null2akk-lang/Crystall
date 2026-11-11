# CRYSTAL DROP

Russian Telegram Mini App for virtual CS2 case openings, upgrades and inventory.

## Architecture

- `src/app.tsx`: existing React interface, shared `Weapon` renderer and game actions.
- `src/styles.css`: existing visual theme; preserve it when adding catalog items.
- `src/lib/game.ts`: shared domain types, legacy items, merged catalog, cases and weighted drop calculations. Imported by the frontend and Cloudflare Worker.
- `src/lib/skin-catalog.ts`: confirmed requested items and bundled image paths. Its `Skin` import is type-only to avoid a runtime import cycle.
- `public/skins/`: local images, including WebP catalog renders. `catalog-sources.json` records original Steam image URLs.
- `scripts/requested-skins.txt`: grouped user request, with official name normalization. Xiphos remains in the request for traceability but is excluded from the confirmed catalog.
- `worker/`: unchanged Cloudflare Workers API and D1 storage. `wrangler.jsonc` configures the original deployment. Do not treat the static Netlify frontend as a migrated game server.
- `tests/`: existing backend tests. `src/test/` and adjacent test files cover existing UI utilities.

## Conventions and decisions

Use TypeScript, existing two-space formatting and Russian interface copy. Never rename legacy skin IDs or change their crystal values as a side effect of image work: inventories store those IDs. Catalog merge matches exact weapon and finish names, updates existing renders and appends only missing finishes. New values are virtual game values, not market data. Knife/glove/charm flags distinguish item categories. Case pools automatically consume the merged catalog, so catalog changes can change individual drop probabilities.

Missing Link, Pinch O' Luck and CZ75-Auto | Xiphos were excluded as unconfirmed names. Both Sunset Storm variants are present. Chicken Lil' and 龍王 (Dragon King) use official names. Doppler uses one representative render per finish, not a phase inventory.

The user explicitly requested preserving the Cloudflare architecture. No storage or authentication migration was performed. Any future persistence feature implemented for Netlify must use Netlify platform storage rather than expanding the legacy D1 implementation.

The Netlify build command installs locked dependencies with `npm ci --include=dev` before running Vite, so direct CLI deployments also have build tools available. Keep `package-lock.json` synchronized with `package.json`. The Netlify pipeline handles build validation. `netlify.toml` publishes Vite output from `dist`. Never commit build output, environment files or credentials.

## Price floors (expensive skins)

`src/lib/game.ts` raises the crystal value of expensive items from their approximate USD price (`skin-prices.ts`): $100-299 -> 45k-85k, $300-999 -> 85k-180k, $1000+ -> 180k and up. Values are only raised, never lowered. StatTrak/Сувенирный/Коллекционный editions follow their base (x1.6 / x4 / x3). Premium case pools use items worth 0.3x-5x the case price.

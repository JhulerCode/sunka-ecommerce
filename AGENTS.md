# AGENTS.md

Guidance for AI coding agents working in this repository. Read this before making changes.

## Project Overview

E-commerce storefront for **SUNKA Herbal Tea** (Peruvian herbal tea brand). It is an
[Astro](https://astro.build) site (SSR) with **Vue 3** islands and **Tailwind CSS v4**. Astro acts
as a BFF: browser code calls same-origin `/api/*` routes, while server-only code talks to the ERP
through `src/lib/server/backend.ts`.

- All user-facing copy is **Spanish (es-PE)**.
- Prices are in Peruvian Soles and rendered as `S/ {valor}`.
- Dates/locale use `es-PE`.
- TypeScript is strict. All Vue scripts use `lang="ts"` and Options API with `defineComponent`.

## Tech Stack

- **Astro 5** — `output: 'server'`, adapter `@astrojs/node` standalone (see `astro.config.ts`).
- **Vue 3** — Options API components mounted as islands with `client:load`.
- **Tailwind CSS 4** — via `@tailwindcss/vite`; theme tokens defined in `src/styles/theme.css` using the `@theme` directive. `src/styles/global.css` is the entry that imports the split styles.
- **pnpm** — the package manager (see `packageManager` in `package.json`). Never use npm/yarn.
- **Vitest + Playwright** — unit/contract tests and browser flows.

## Commands

All commands run from the repo root with pnpm:

```sh
pnpm install        # install dependencies
pnpm dev            # start dev server (default http://localhost:4321)
pnpm build          # production build (SSR, outputs to dist/)
pnpm typecheck      # Astro/TypeScript diagnostics
pnpm test           # Vitest suite
pnpm test:e2e       # Playwright suite
pnpm verify         # typecheck + unit tests + build
pnpm preview        # preview the production build locally
pnpm astro -- --help # Astro CLI help
```

- Add unit tests under `tests/unit` and browser flows under `tests/e2e`.
- **Lint/format:** there is **no ESLint, Biome, or lint script**. Formatting is defined by
  `.prettierrc.json` + `.editorconfig` (see below). Run `pnpm build` to validate.
- **Typecheck:** run `pnpm typecheck`; all changes must keep strict diagnostics at zero errors.
- Local development expects the backend API at the private URL in `.env` (`API_URL`, usually
  `http://localhost:4000`). Pages that call the API will return empty data / rewrite to `/404`
  without it.

## Project Structure

```
src/
  assets/          # images (.webp/.jpg/.svg/.mp4) and icon components (.astro/.vue)
    icons/         #   icons — icon-*.astro for static, *.vue for interactive
  components/
    ui/            #   Jd* form controls and LoadingSpin
    layout/        #   Header, HeaderTopBar, Footer
    account/       #   AccountPanel*, AuthModal
    cart/          #   CartDrawer
    checkout/      #   CheckoutForm
    blend/         #   BlendForm
    forms/         #   ArcoForm, LibroReclamacionesForm, ConsultaPedidoForm, NewsLetterForm
    producto/      #   sections for /productos/[slug]
    club/          #   sections for /club
    rituales/      #   sections for /rituales
    origen/        #   sections for /origen
    legal/         #   LegalLayout + long legal content
    home/          #   home page section components
    lineas/        #   product-line page sections
    inspiracion/   #   inspiracion page sections
    tienda/        #   tienda page components
    pedidos/       #   order detail components
    shared/        #   cross-page components (e.g. HeroPremium)
  data/
    products/      #   one JSON file per ERP article
    content/       #   company, lineas, momentos, pickup locations, ritual articles
    blend-options.ts
  layouts/         # BaseLayout.astro (used by every page)
  lib/
    api/           #   same-origin BFF client + Zod schemas
    catalog/       #   product formatting, content validation, pricing, slugs, facets
    cart/          #   localStorage cart
    blend/         #   blend customizer state
    checkout/      #   draft, lines, promotions, delivery/payment dates
    utils/         #   currency, date, number and id helpers
    server/        #   server-only ERP/BFF access, catalog service, checkout, mail
    mail/          #   email templates
  pages/api/       # explicit BFF endpoints
  pages/           # routes; [slug].astro files are dynamic routes
  styles/          # global.css entry + theme/base/components/legal split
  types/           # api, product, cart, checkout and content types
```

- Images are imported as modules (e.g. `import banner from '@/assets/banner1.webp'`) so Astro
  optimizes them. Never reference `src/assets` via a raw URL.
- `dist/`, `.astro/`, `node_modules/`, `mockups/` are gitignored build artifacts.

### Where each thing goes

| Need | Location |
| --- | --- |
| Page route | `src/pages/` |
| Page section / static markup | `src/components/<page>/` |
| Interactive Vue island | `src/components/<feature>/*.vue` |
| Reusable form control | `src/components/ui/` |
| API/BFF contract types | `src/types/` |
| Pure shared logic | `src/lib/catalog`, `src/lib/checkout`, `src/lib/utils` |
| ERP/BFF access (server only) | `src/lib/server/` |
| Static content | `src/data/content/` |
| Product content | `src/data/products/*.json` |
| Design tokens | `src/styles/theme.css` |

## Code Style

### Formatting

Canonical settings (from `.prettierrc.json` and `.editorconfig`):

- **No semicolons**, single quotes, print width **100**.
- Indentation: **4 spaces** (also 4-space in templates/frontmatter), LF line endings, no final newline inserted.
- Do NOT add code comments unless necessary. Existing files mix short Spanish comments; keep them minimal.

> Note: some legacy files (`src/lib/cart/cart.ts`, `src/lib/blend/blend.ts`, the account panels)
> still use semicolons or double quotes and predate the Prettier config. Match the **config** for
> new code; avoid reformatting whole legacy files unless asked.

### Imports & Aliases

- Prefer the alias `@/` → `src/` for cross-folder imports:
  `import BaseLayout from '@/layouts/BaseLayout.astro'`.
- Relative imports are acceptable within the same folder. Prefer `@/` in page-level scripts
  (e.g. `import { Cart } from '@/lib/cart/cart'` inside a `<script>` tag).
- Use extensionless imports for `.ts`; `.astro` and `.vue` extensions remain conventional.
- Imports come first in the frontmatter, then constants/logic.

### Language & Naming

- **Code identifiers in English**: `get`, `formatProductos`, `productosFiltrados`, `applyUrlFilters`.
- **Product data fields in English** (they mirror the storefront content contract):
  `article_id`, `slug`, `published`, `sort_order`, `featured`, `featured_order`, `name`,
  `short_description`, `description`, `photos`, `photo`, `price`, `club_price`,
  `previous_price`, `regular_price`, `presentation`, `certifications`, `sensory_profile`,
  `preparation`, `related_products`, `seo_title`, `seo_description`, `previous_slugs`, `unit`.
  Exception: customer/partner data mirrors the ERP in English (`name`, `document_type`,
  `document_number`, `email`, `phone1`, `addresses`, `contacts`, `partner_data`). Auth
  credentials use the English integration contract (`email`, `password`, `verification_code`,
  `password_updated_at`). Static site data (`src/data/`, blend customizer, pickup locations)
  and UI filter state keep their existing Spanish keys.
- Files/components: **PascalCase** for `.astro`/`.vue` component files (except icons, see below);
  **kebab-case** for icon files (`icon-*.astro`, `chevron-left.vue`); lowercase for `.js` modules.
- Keep Spanish strings unaccented vs accented inconsistent across the codebase; prefer accented
  Spanish in new UI copy (e.g. "preparación").

### Astro Pages & Components

- Every page imports `BaseLayout` and passes `title` (and `description`) props:
  `<BaseLayout title={`X | SUNKA Herbal Tea`}>`.
- Dynamic pages read `Astro.params`, e.g. `const { slug } = Astro.params`.
- Server data fetching uses `serverGet` or `backendRequest`; never call browser helpers from SSR.
- When a record is missing, return early with `Astro.rewrite('/404')` (never a hard error).
- Build store products with `getStoreProducts()` / `getStoreProductBySlug()` from
  `src/lib/server/catalog/service.ts`: they merge the ERP master data with
  `src/data/products/*.json` and normalize with `formatProductos` from
  `src/lib/catalog/product-format.ts`.
- Pass data to Vue islands via props and mount with `client:load`
  (`<TiendaCatalog client:load productos={productos} lineas={lineas} />`).
- Interactive DOM wiring for static pages lives in the section component that owns the markup
  and is driven by `data-*` attributes (`[data-gallery]`, `[data-quantity]`).

### Vue Components

- **Options API only**: `export default { name, components, props, data(), computed, watch, mounted, methods }`.
- Template first, then `<script>`, then optional `<style scoped>`.
- Props are plain objects with `type` and `required`/`default` (arrays/objects use factory defaults).
- Keep data mutations in `methods`; derived values in `computed`; side effects (URL sync, cart
  events) in `watch`/`mounted`.
- Store component-local validation/status flags in `data` (e.g. `loading`, `error`, `showMsg`).
- Names of state and methods are English camelCase.

### Data Files (`src/data/`)

- Export plain JS arrays of objects plus a lookup map and a small accessor:
  `export const lineas`, `export const lineasBySlug`, `export const getLineaBySlug = (slug) => lineasBySlug[slug]`.
- Reference imported assets, not hardcoded URLs.
- Product content lives in `src/data/products/<article_id>.json` (one file per ERP article).
  `src/lib/server/catalog/content.ts` loads and validates them; the schema lives in
  `src/types/product.ts` and validation in `src/lib/catalog/product-content.ts`. `published: false`
  hides a product. Photos are MinIO URLs in the JSON, never binaries in the repo. A slug change
  must add the old value to `previous_slugs` so the detail page can redirect with 301.

### API Layer, BFF & Error Handling

- Vue uses `src/lib/api/client.ts` and only same-origin `/api/*` endpoints. Astro SSR uses the
  server-only client. Never expose `API_URL`, `ERP_API_KEY`, `X-API-Key`, or authorization headers.
- The BFF sends only the fixed parameters each integration endpoint declares (`ids`, `linea`,
  `categoria`, `search`, etc.). Never forward `qry`, `cols`, `incl`, tenant, or
  upstream URLs; the legacy `{ fltr, cols, incl }` shape is removed.
- The checkout order number lives in the BFF: `src/lib/server/order-code.ts` generates
  `partner_order.code` as `YYMMDD<6 digits>` with the `America/Lima` date. The ERP stores it as
  received and only verifies uniqueness; never send a code generated by the browser. That value
  is the `orderId` sent to Izipay and the `purchaseNumber` sent to Niubiz (12 digits required).
- Delivery coverage is a store policy: `prepareCheckoutOrder` only accepts `envio` when the
  selected ubigeo belongs to Lima; the ERP only validates that the ubigeo exists.
- The checkout calculates the line prices **net of IGV** on the server: the BFF ignores the
  browser's `unit_price`, resolves the current price from `src/data/products`, uses the
  article's `igv_afectacion` and a server-side IGV rate, and recalculates promotions, delivery
  and total. `currency_id: 'PEN'` and `payment_method: 'tarjeta'` are fixed by the store;
  `delivery_cost` travels as the final charge. The ERP validates format, arithmetic, currency
  and payment catalogs, but trusts the integration for the net price. The store limits the
  cart to 50 lines and 100 units per line.
- The order page shows each line's `total` returned by the ERP (gross); `unit_price` is net.
- The checkout only declares the customer's receipt type (`invoice_type`); the invoice series is
  chosen by the ERP when it issues the invoice. The delivery article is configured server-side in
  `ERP_DELIVERY_ARTICLE_ID` and sent as `delivery_article_id` when `delivery_cost > 0`; never
  accept it from the browser.
- Successful responses use `{ data, meta?, warnings? }`; errors use the ERP Problem Details
  (`application/problem+json`) with `type`, `errorCode`, `title`, `status`, `detail`, `instance`.
  Client helpers return the discriminated `ApiResult<T>` type.
- Check `result.ok`; use `result.problem.type` for behavior and `result.problem.detail` for safe
  user-facing text. HTTP `401` means the HttpOnly session expired. Always reset `loading`.
- Keep validation (email regex, required fields) in the component before submitting.
- The wrapper already `console.log`s messages via `jmsg`; do not duplicate logging.
- Authentication is cookie-based and HttpOnly. Never store or read auth/order tokens in browser code.

### Environment Variables

- Private vars are `API_URL`, `ERP_API_KEY`, `ERP_GUEST_PARTNER_ID`,
  `ERP_DELIVERY_ARTICLE_ID`, `PAYMENT_PROVIDER`, `RECAPTCHA_SECRET_KEY`, `SMTP_HOST`,
  `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM`.
- Browser vars are `PUBLIC_IZIPAY_PUBLIC_KEY` and `PUBLIC_RECAPTCHA_SITE_KEY`.
- The BFF validates reCAPTCHA for ARCO and libro de reclamaciones with
  `RECAPTCHA_SECRET_KEY`; the ERP does not validate captcha.
- Los correos al cliente se renderizan en `src/lib/mail/` y se envían con
  `src/lib/server/mail.ts`; el ERP solo devuelve los datos y no redacta plantillas.
- The card payment provider (`izipay` or `niubiz`) is decided by the storefront through the
  server-only `PAYMENT_PROVIDER` variable (`activePaymentProvider`); the ERP only exposes the
  provider-specific payment endpoints.

### Styling & Tailwind

- Reuse the SUNKA palette tokens defined in `theme.css` `@theme`:
  `sunka-ink`, `sunka-forest`, `sunka-olive`, `sunka-brass`, `sunka-brass-light`, `sunka-cream`,
  `sunka-sand`, `sunka-stone`, `sunka-white` (e.g. `bg-sunka-cream`, `text-sunka-brass`).
- Use `font-heading` for display type, `font-sans` otherwise.
- Prefer utility classes inline; add shared composite classes (`.button`, `.input`, `.modal`) to
  `src/styles/components.css` only when reused widely.
- The `.fade-up` class + IntersectionObserver (wired in `BaseLayout`) drives scroll reveals; add
  `.delay-1`/`.delay-2`/`.delay-3` for stagger.
- Keep section markup consistent: `<section>` with a `max-w-7xl mx-auto px-5 md:px-8` container.

### Assets & Icons

- Static decorative icons live as `.astro` (or `.svg`) in `src/assets/icons/`; icons needing Vue
  reactivity/props live as `.vue` (e.g. `chevron-left.vue`).
- Import an icon component and render it, not inline SVGs (unless in a Vue template).

## Workflow Conventions

- Commit messages follow Conventional Commits: `feat:`, `fix:`, `refactor:`, etc., lowercase
  subject (see `git log`). No other commit discipline is enforced.
- Do not modify `.env`, `pnpm-lock.yaml`, or build artifacts (`dist/`, `.astro/`) unless the task
  explicitly requires it.
- After a change, run `pnpm build` to confirm the site compiles.

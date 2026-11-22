# ShopLedger guidance

## Stack
- Node.js with CommonJS modules.
- Express 4 serves the API and the static browser app; `body-parser` parses JSON requests.
- The browser UI is plain HTML, CSS, and JavaScript under `public/`.
- Application data is stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, creation, and cancellation endpoints.
- `routes/products.js` — product listing and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon normalization, lookup, validation, discount calculation, and listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation, release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — Khata customer balances, order charges/reversals, and settlements.
- `lib/orders.js` — order add, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — subtotal, coupon discount, and checkout totals with line-level GST.
- `lib/reports.js` — dashboard summary and invoice-to-order GST reconciliation.
- `lib/store.js` — read/write JSON data and append audit entries.
- `lib/tax.js` — item GST rate/slab lookup and CGST/SGST split.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test` (Node.js built-in test runner).
- `npm test` is currently a placeholder that exits with “no test specified”.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).

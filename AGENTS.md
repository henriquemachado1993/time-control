# Repository instructions

- Read [PRODUCT.md](PRODUCT.md) before changing product behavior or user-facing claims. Its explicitly labeled audience and principles are inferences until the user confirms them.
- Read [MEMORY.md](MEMORY.md) before changing authentication, account data, date and time handling, or overtime calculations.
- Derive the account identity from the server-side session. Scope every private database read, update, and delete to the authenticated user, including routes addressed by record ID.
- Keep the existing Portuguese (Brazil) interface, light and dark themes, shared UI components, and established routes when changing the product UI.
- Keep the overtime threshold consistent across its API handlers. When changing this rule, update PRODUCT.md if the product's fixed or configurable behavior changes.
- For code changes, run `npm run build`, `npx tsc --noEmit`, and ESLint on the files you changed.

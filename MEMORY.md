# Project memory

Durable implementation details for future agents. Product intent and unresolved product decisions live in [PRODUCT.md](PRODUCT.md); repository working rules live in [AGENTS.md](AGENTS.md).

## Account ownership

NextAuth authenticates each account. API handlers find the account from the server-side session and use its database ID as `user_id` for private work-hour and overtime queries. Preserve this boundary on every collection and ID-based handler. A request parameter alone does not establish record ownership.

## Stored time values

`work_hours.date` is stored as a `YYYY-MM-DD` string; `start_time` and `end_time` are strings in 24-hour `HH:mm` format. Preserve local calendar dates when parsing, formatting, or grouping these values. A work day may contain several separate records.

`src/lib/hours.ts` provides shared `formatHours` and `workedHours` helpers for the UI. Keep visible durations in whole minutes and use tabular numerals for totals.

## Overtime calculation

Extra hours are computed from the day's summed work intervals, applying a fixed eight-hour baseline to each day. The available balance is generated hours minus recorded uses, clamped at zero. The calculation is implemented in `src/app/api/horas-extras/disponivel/route.ts` and repeated in the overtime usage API handlers. Keep all implementations consistent when changing this behavior.

`extra_hours_usage.hours_used` is stored in decimal hours. The interface accepts decimal values or `hours:minutes` input and converts the latter before submitting.

## Interface and validation

The web app uses Next.js App Router, TypeScript, Tailwind CSS 4, shared Radix-based UI components under `src/components/ui`, and Lucide icons. Theme selection is handled by `next-themes`.

The API uses Next.js route handlers, NextAuth, Prisma, and PostgreSQL. For code changes, use the build and type-check commands in `package.json`, plus ESLint on the changed files; the existing `lint` script targets `next lint`, which is unavailable in this Next.js version.

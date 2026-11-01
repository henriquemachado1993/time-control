import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/load-source.mjs";

const { localDate, dateKey, monthStart, dayLabel } = loadSource("src/app/(dashboard)/dashboard/lib/dates.ts");

test("stored dates retain their local calendar day across time zones", () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ["America/Sao_Paulo", "UTC", "Pacific/Auckland"]) {
      process.env.TZ = timezone;
      for (const key of ["2026-01-01", "2026-12-31", "2028-02-29"]) {
        const date = localDate(key);
        assert.equal(dateKey(date), key);
        assert.equal(date.getHours(), 12);
        assert.match(dayLabel(date), new RegExp(String(date.getDate())));
      }
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test("month normalization preserves local year transitions and leap days", () => {
  assert.equal(dateKey(monthStart(localDate("2026-12-31"))), "2026-12-01");
  assert.equal(dateKey(monthStart(localDate("2027-01-31"))), "2027-01-01");
  assert.equal(dateKey(monthStart(localDate("2028-02-29"))), "2028-02-01");
});

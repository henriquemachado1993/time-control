import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/load-source.mjs";

const { summarizeWorkDays } = loadSource("src/lib/work-days.ts");
const period = (date, start_time, end_time, description = "") => Object.freeze({ date, start_time, end_time, description });

test("daily summary groups unsorted periods and counts closed days separately", () => {
  const records = Object.freeze([
    period("2026-12-31", "13:00", "16:00"),
    period("2027-01-02", "08:00", null),
    period("2027-01-01", "08:00", "16:00"),
    period("2026-12-31", "08:00", "12:00"),
    period("2026-12-31", "17:00", null),
  ]);
  const summary = summarizeWorkDays(records);
  assert.deepEqual([...summary.days.keys()], ["2027-01-02", "2027-01-01", "2026-12-31"]);
  assert.equal(summary.totalMinutes, 900);
  assert.equal(summary.completedDayCount, 2);
  assert.equal(summary.days.get("2026-12-31").minutes, 420);
  assert.equal(summary.days.get("2026-12-31").completedCount, 2);
  assert.deepEqual(summary.days.get("2026-12-31").records, [records[0], records[3], records[4]]);
  assert.equal(summary.days.get("2026-12-31").records[0], records[0]);
});

test("open-only days remain visible with zero worked minutes and zero completed days", () => {
  const summary = summarizeWorkDays([period("2026-10-31", "08:00", null)]);
  assert.equal(summary.days.size, 1);
  assert.equal(summary.totalMinutes, 0);
  assert.equal(summary.completedDayCount, 0);
  assert.equal(summary.days.get("2026-10-31").completedCount, 0);
  assert.equal(summary.days.get("2026-10-31").records.length, 1);
});

test("filtered results keep their own totals without mutating a full day's summary", () => {
  const records = [period("2026-10-31", "08:00", "12:00", "alpha"), period("2026-10-31", "13:00", "17:00", "beta")];
  const full = summarizeWorkDays(records);
  const filtered = summarizeWorkDays(records.filter(record => record.description === "alpha"));
  assert.equal(filtered.totalMinutes, 240);
  assert.equal(filtered.days.get("2026-10-31").records.length, 1);
  assert.equal(full.days.get("2026-10-31").minutes, 480);
  assert.equal(full.days.get("2026-10-31").records.length, 2);
});

test("whole-minute accumulation avoids fractional-hour rounding", () => {
  const summary = summarizeWorkDays([period("2026-10-31", "08:00", "08:20"), period("2026-10-31", "09:00", "09:40")]);
  assert.equal(summary.totalMinutes, 60);
  assert.equal(summary.days.get("2026-10-31").minutes, 60);
});

test("date keys stay literal calendar dates and empty histories have no days", () => {
  const summary = summarizeWorkDays([period("2027-01-01", "00:00", "00:30")]);
  assert.deepEqual([...summary.days.keys()], ["2027-01-01"]);
  const empty = summarizeWorkDays([]);
  assert.equal(empty.days.size, 0);
  assert.equal(empty.totalMinutes, 0);
  assert.equal(empty.completedDayCount, 0);
});

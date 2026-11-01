import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/load-source.mjs";

const overtime = loadSource("src/lib/overtime.ts");
const { calculateOvertime } = overtime;
const period = (date, start_time, end_time) => ({ date, start_time, end_time });
const periods = [
  period("2026-10-26", "08:00", "12:00"),
  period("2026-10-26", "13:00", "18:00"),
  period("2026-10-27", "08:00", "10:00"),
  period("2026-10-27", "11:00", null),
];

test("sums a day's periods before applying the target, ignoring open periods", () => {
  assert.deepEqual(calculateOvertime(periods, 480, 0.25), {
    total_generated: 1, total_used: 0.25, available: 0.75,
    breakdown_by_date: { "2026-10-26": 1 },
  });
});

test("changing the daily target reapplies it independently to every day", () => {
  assert.deepEqual(calculateOvertime(periods, 450).breakdown_by_date, { "2026-10-26": 1.5 });
  assert.equal(calculateOvertime(periods, 540).total_generated, 0);
});

test("short days do not offset overtime from another day", () => {
  assert.equal(calculateOvertime(periods, 480).total_generated, 1);
});

test("sums whole minutes before converting to decimal hours", () => {
  const records = [period("2026-10-26", "08:00", "08:20"), period("2026-10-26", "09:00", "09:40")];
  assert.equal(calculateOvertime(records, 60).total_generated, 0);
  assert.equal(calculateOvertime(records, 1).total_generated, 59 / 60);
});

test("empty histories and excess recorded usage never expose a negative balance", () => {
  assert.deepEqual(calculateOvertime([], 480), { total_generated: 0, total_used: 0, available: 0, breakdown_by_date: {} });
  const bank = calculateOvertime(periods, 480, 2);
  assert.equal(bank.available, 0);
  assert.equal(bank.total_used, 2);
});

function routeFixture(file, options = {}) {
  const writes = [];
  const reads = [];
  const usage = { id: "owned", user_id: "account", hours_used: options.existingHours ?? 0.5, created_at: new Date() };
  const scoped = (args) => {
    assert.equal(args.where.user_id, "account");
    reads.push(args);
  };
  const prisma = {
    user: { findUnique: async (args) => {
      assert.equal(args.where.email, "owner@example.invalid");
      return options.missingAccount ? null : { id: "account", dailyTargetMinutes: options.target ?? 450 };
    } },
    work_hours: { findMany: async (args) => { scoped(args); return periods; } },
    extra_hours_usage: {
      aggregate: async (args) => {
        scoped(args);
        const used = args.where.id?.not === "owned" ? 0.25 : options.used ?? 0.75;
        return { _sum: { hours_used: used } };
      },
      findFirst: async (args) => { scoped(args); return args.where.id === "owned" ? usage : null; },
      create: async (args) => {
        assert.equal(args.data.user_id, "account");
        writes.push(args);
        return { ...usage, ...args.data };
      },
      update: async (args) => {
        scoped(args);
        assert.equal(args.where.id, "owned");
        writes.push(args);
        return { ...usage, ...args.data };
      },
    },
  };
  const route = loadSource(file, {
    "@/lib/overtime": overtime,
    "@/lib/prisma": { prisma },
    "@/lib/auth": { authOptions: {} },
    "next-auth": { getServerSession: async () => options.unauthenticated ? null : { user: { email: "owner@example.invalid" } } },
  });
  const request = (hours = 0.75) => new Request("http://localhost/api/horas-extras/uso", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: "2026-10-28", hours_used: hours, description: "Teste" }),
  });
  return { route, request, writes, reads };
}

const availableFile = "src/app/api/horas-extras/disponivel/route.ts";
const usageFile = "src/app/api/horas-extras/uso/route.ts";
const editFile = "src/app/api/horas-extras/uso/[id]/route.ts";

test("balance handler applies the account target and recorded usage", async () => {
  const { route } = routeFixture(availableFile);
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), calculateOvertime(periods, 450, 0.75));
});

test("creation allows exactly the available balance and rejects any excess", async () => {
  const { route, request, writes } = routeFixture(usageFile);
  assert.equal((await route.POST(request(0.75))).status, 201);
  assert.equal((await route.POST(request(0.76))).status, 400);
  assert.equal(writes.length, 1);
});

test("editing excludes the current usage from the available balance", async () => {
  const { route, request, reads, writes } = routeFixture(editFile);
  const response = await route.PUT(request(1.25), { params: Promise.resolve({ id: "owned" }) });
  assert.equal(response.status, 200);
  assert.ok(reads.some(args => args.where.id?.not === "owned"));
  assert.equal(writes[0].data.hours_used, 1.25);
});

test("editing preserves an existing usage after the target reduces available hours", async () => {
  const { route, request, writes } = routeFixture(editFile, { target: 600, existingHours: 2 });
  assert.equal((await route.PUT(request(2), { params: Promise.resolve({ id: "owned" }) })).status, 200);
  assert.equal((await route.PUT(request(2.01), { params: Promise.resolve({ id: "owned" }) })).status, 400);
  assert.equal(writes.length, 1);
});

test("an ID from another account cannot be edited or used to query the balance", async () => {
  const { route, request, writes, reads } = routeFixture(editFile);
  assert.equal((await route.PUT(request(), { params: Promise.resolve({ id: "someone-elses" }) })).status, 404);
  assert.equal(reads.length, 1);
  assert.equal(writes.length, 0);
});

test("unauthenticated requests never query private records", async () => {
  for (const [file, method] of [[availableFile, "GET"], [usageFile, "POST"], [editFile, "PUT"]]) {
    const { route, request, reads, writes } = routeFixture(file, { unauthenticated: true });
    const response = await route[method](request(), { params: Promise.resolve({ id: "owned" }) });
    assert.equal(response.status, 401);
    assert.equal(reads.length, 0);
    assert.equal(writes.length, 0);
  }
});

test("scheduled calculation uses each account's target and disconnects afterward", async (context) => {
  const logs = context.mock.method(console, "info", () => {});
  const queriedUsers = [];
  let disconnected = false;
  const client = {
    user: { findMany: async (args) => {
      assert.equal(args.select.dailyTargetMinutes, true);
      return [
        { id: "first", email: "first@example.invalid", dailyTargetMinutes: 450 },
        { id: "second", email: "second@example.invalid", dailyTargetMinutes: 600 },
      ];
    } },
    work_hours: { findMany: async (args) => {
      assert.ok(["first", "second"].includes(args.where.user_id));
      assert.deepEqual(args.where.end_time, { not: null });
      queriedUsers.push(args.where.user_id);
      return periods;
    } },
    extra_hours_usage: { findMany: async () => [] },
    connectionHeartbeat: { upsert: async () => ({ id: "heartbeat" }) },
    $disconnect: async () => { disconnected = true; },
  };
  const route = loadSource("src/app/api/cron/route.ts", {
    "@/lib/overtime": overtime,
    "@prisma/client": { PrismaClient: class { constructor() { return client; } } },
  });
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).cronResults.extraHoursRecalculation.processedUsers, 2);
  assert.deepEqual(queriedUsers, ["first", "second"]);
  const messages = logs.mock.calls.map(call => call.arguments.join(" "));
  assert.ok(messages.some(message => message.includes("first@example.invalid: 1.50h")));
  assert.ok(messages.some(message => message.includes("second@example.invalid: 0.00h")));
  assert.equal(disconnected, true);
});

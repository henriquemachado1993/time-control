import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/load-source.mjs";

function layoutFixture(session, failure) {
  const authOptions = {};
  const SessionGuard = () => null;
  const Navigation = () => null;
  const { default: layout } = loadSource("src/app/(dashboard)/layout.tsx", {
    "@/lib/auth": { authOptions },
    "next-auth": { getServerSession: async (options) => {
      assert.equal(options, authOptions);
      if (failure) throw failure;
      return session;
    } },
    "next/navigation": { redirect: (location) => { throw Object.assign(new Error("Redirect"), { location }); } },
    "@/components/navigation": { Navigation },
    "./components/session-guard": { SessionGuard },
  });
  return { layout, SessionGuard, Navigation };
}

test("protected layout redirects missing or incomplete sessions before rendering its shell", async () => {
  for (const session of [null, {}, { user: {} }, { user: { email: "" } }]) {
    const { layout } = layoutFixture(session);
    await assert.rejects(() => layout({ children: "private screen" }), error => error.location === "/login");
  }
});

test("authenticated layout wraps navigation and private content in the shared client guard", async () => {
  const { layout, SessionGuard, Navigation } = layoutFixture({ user: { email: "owner@example.invalid" } });
  const result = await layout({ children: "private screen" });
  assert.equal(result.type, SessionGuard);
  const shell = result.props.children;
  const [navigation, main] = shell.props.children;
  assert.equal(navigation.type, Navigation);
  assert.equal(main.type, "main");
  assert.equal(main.props.id, "conteudo");
  assert.equal(main.props.children, "private screen");
});

test("session lookup failures never render the protected shell", async () => {
  const failure = new Error("Session lookup failed");
  const { layout } = layoutFixture(null, failure);
  await assert.rejects(() => layout({ children: "private screen" }), error => error === failure);
});

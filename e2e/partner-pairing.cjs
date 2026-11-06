// Partner pairing end-to-end test.
//
// Alice invites Bob by link, Bob signs up through it, both see each other on
// the hub and partner page; Carol (an outsider) can't see or join them. Then
// Bob leaves the team and Alice's old link stops working.
//
// Run against a LOCAL Supabase stack (it creates throwaway users) — see
// README "Partner pairing E2E test".
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!SB_KEY) throw new Error("Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (local stack key).");
const SHOTS = process.env.E2E_SHOTS_DIR ?? path.join(__dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const RUN = Date.now().toString(36);
const PASSWORD = "catnap123";

const users = {
  alice: { email: `alice-${RUN}@example.com`, name: "Alice", avatar: path.join(ROOT, "public/gymcats-hero-cat.png") },
  bob: { email: `bob-${RUN}@example.com`, name: "Bob", avatar: path.join(ROOT, "public/gymcats-hero-tuxedo-cat.png") },
  carol: { email: `carol-${RUN}@example.com`, name: "Carol", avatar: null },
};

const step = (msg) => console.log(`\n▶ ${msg}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function signUp(page, user) {
  // Assumes we're already on /login?mode=signup (directly or via invite).
  await page.fill("#email", user.email);
  await page.fill("#password", PASSWORD);
  await page.fill("#confirmPassword", PASSWORD);
  await page.click('button[type="submit"]:has-text("Create account")');
  await page.waitForURL(/\/login\?created=/);
}

async function logIn(page, user) {
  await page.fill("#email", user.email);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]:has-text("Log in")');
}

async function onboard(page, user) {
  await page.waitForURL(/\/onboarding/);
  await page.fill("#displayName", user.name);
  await page.fill("#age", "29");
  await page.click('button:has-text("Next")');
  await page.fill("#heightFeet", "5");
  await page.fill("#heightInches", "8");
  await page.fill("#weightLb", "150");
  await page.click('button:has-text("Next")');
  await page.click('button[aria-pressed]:has-text("Build strength")');
  await page.click('button[aria-pressed]:has-text("Stay consistent")');
  await page.selectOption("#workoutsPerWeek", "4");
  await page.click('button:has-text("Next")');
  if (user.avatar) await page.setInputFiles("#avatar", user.avatar);
  await page.click('button:has-text("Save profile")');
  await page.waitForSelector("text=Your partner");
}

(async () => {
  const browser = await chromium.launch();
  const ctx = {};
  const page = {};
  for (const k of Object.keys(users)) {
    ctx[k] = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    page[k] = await ctx[k].newPage();
    page[k].setDefaultTimeout(60000);
  }

  try {
    // ---------------------------------------------------------------- Alice
    step("Alice signs up, onboards and gets her invite link");
    await page.alice.goto(`${BASE}/login?mode=signup`);
    await signUp(page.alice, users.alice);
    await logIn(page.alice, users.alice);
    await onboard(page.alice, users.alice);
    await page.alice.click('button:has-text("Get my invite link")');
    const linkEl = page.alice.getByTestId("invite-link");
    await linkEl.waitFor();
    await page.alice.waitForFunction(() =>
      document.querySelector('[data-testid="invite-link"]')?.textContent?.startsWith("http"),
    );
    const inviteLink = (await linkEl.textContent()).trim();
    assert.match(inviteLink, /\/invite\/[A-Z0-9]{6}$/);
    assert.ok(inviteLink.startsWith(BASE), "invite link should be absolute");
    const code = inviteLink.split("/").pop();
    ok(`invite link: ${inviteLink}`);
    await shot(page.alice, "01-alice-partner-step-link");

    await page.alice.click('button:has-text("Finish")');
    await page.alice.waitForURL(/\/hub/);
    await page.alice.getByText("Invite partner").waitFor();
    ok("Alice's hub shows 'Invite partner' in the top-right while solo");
    await shot(page.alice, "02-alice-hub-solo");

    // ------------------------------------------------------------------ Bob
    step("Bob opens Alice's link while logged out");
    await page.bob.goto(inviteLink);
    await page.bob.getByText("Alice wants you on their team").waitFor();
    ok("invite page names the inviter");
    await shot(page.bob, "03-bob-invite-logged-out");

    await page.bob.click('button:has-text("Sign up to join")');
    await page.bob.waitForURL(/\/login\?mode=signup/);
    await page.bob.getByText("joining").waitFor();
    assert.match(await page.bob.textContent("body"), /You're joining Alice's team/);
    ok("sign-up page carries the invite context");
    await shot(page.bob, "04-bob-signup-with-invite");

    await signUp(page.bob, users.bob);
    await page.bob.getByText("joining").waitFor();
    ok("invite context survives the sign-up → log-in hop");
    await logIn(page.bob, users.bob);
    await page.bob.waitForURL(new RegExp(`/invite/${code}$`));
    ok("after login Bob lands back on the invite");
    await page.bob.click('button:has-text("Team up with Alice")');
    await page.bob.waitForURL(/\/onboarding/);
    ok("joined, then sent to onboarding");

    await onboard(page.bob, users.bob);
    await page.bob.getByText("You're teamed up with").waitFor();
    assert.match(await page.bob.textContent("body"), /teamed up with Alice/);
    ok("partner step already knows Bob is teamed with Alice");
    await shot(page.bob, "05-bob-partner-step-paired");
    await page.bob.click('button:has-text("Let\'s go")');
    await page.bob.waitForURL(/\/hub/);

    step("Both hubs show the partner in the top-right");
    const bobBadge = page.bob.getByRole("link", { name: "View Alice's profile" });
    await bobBadge.waitFor();
    assert.equal(await page.bob.locator('img[alt="Alice\'s profile photo"]').count() > 0, true);
    ok("Bob's hub: Alice badge with her photo");
    await shot(page.bob, "06-bob-hub");

    await page.alice.reload();
    await page.alice.getByRole("link", { name: "View Bob's profile" }).waitFor();
    ok("Alice's hub: Bob badge");
    await shot(page.alice, "07-alice-hub");

    step("Partner profile pages");
    await bobBadge.click();
    await page.bob.waitForURL(/\/partner$/);
    await page.bob.getByRole("heading", { name: "Alice" }).waitFor();
    const aliceImg = page.bob.locator('img[alt="Alice\'s profile photo"]');
    const loaded = await aliceImg.evaluate((img) => img.complete && img.naturalWidth > 0);
    assert.equal(loaded, true, "Alice's avatar should load for Bob (partner storage policy)");
    assert.match(await page.bob.textContent("body"), /Build strength/);
    assert.match(await page.bob.textContent("body"), /4 workouts a week/);
    ok("Bob sees Alice's profile, goals and photo");
    await shot(page.bob, "08-bob-views-alice");

    await page.alice.getByRole("link", { name: "View Bob's profile" }).click();
    await page.alice.getByRole("heading", { name: "Bob" }).waitFor();
    ok("Alice sees Bob's profile");
    await shot(page.alice, "09-alice-views-bob");

    await page.bob.goto(`${BASE}/battle`);
    await page.bob.getByText("You and Alice stand ready").waitFor();
    ok("battle screen shows the team");

    // ---------------------------------------------------------------- Carol
    step("Carol (outsider) can't see or join the team");
    await page.carol.goto(inviteLink);
    await page.carol.getByText("This team is already full").waitFor();
    assert.doesNotMatch(await page.carol.textContent("body"), /Alice/);
    ok("full invite reveals no names");
    await shot(page.carol, "10-carol-full-invite");

    const carol = createClient(SB_URL, SB_KEY);
    await carol.auth.signUp({ email: users.carol.email, password: PASSWORD });
    const { error: carolLogin } = await carol.auth.signInWithPassword({ email: users.carol.email, password: PASSWORD });
    assert.equal(carolLogin, null);
    const { data: carolProfiles } = await carol.from("profiles").select("id, display_name");
    assert.deepEqual(carolProfiles, []);
    const { data: carolMembers } = await carol.from("couple_members").select("*");
    assert.deepEqual(carolMembers, []);
    const { data: carolCouples } = await carol.from("couples").select("*");
    assert.deepEqual(carolCouples, []);
    ok("RLS: Carol reads 0 profiles / memberships / couples");

    const bobApi = createClient(SB_URL, SB_KEY);
    await bobApi.auth.signInWithPassword({ email: users.bob.email, password: PASSWORD });
    const { data: bobProfiles } = await bobApi.from("profiles").select("id, display_name");
    assert.deepEqual(bobProfiles.map((p) => p.display_name).sort(), ["Alice", "Bob"]);
    ok("RLS: Bob reads exactly his and Alice's profiles");

    const aliceId = bobProfiles.find((p) => p.display_name === "Alice").id;
    const { data: carolSigned } = await carol.storage.from("avatars").createSignedUrl(`${aliceId}/avatar`, 60);
    assert.equal(carolSigned, null);
    const { data: bobSigned } = await bobApi.storage.from("avatars").createSignedUrl(`${aliceId}/avatar`, 60);
    assert.ok(bobSigned?.signedUrl);
    ok("storage: Bob can read Alice's avatar, Carol can't");

    const { error: carolUpload } = await carol.storage
      .from("avatars")
      .upload(`${aliceId}/avatar`, new Blob(["x"], { type: "image/png" }), { upsert: true });
    assert.ok(carolUpload, "Carol must not overwrite Alice's avatar");
    const { error: bobUpload } = await bobApi.storage
      .from("avatars")
      .upload(`${aliceId}/avatar`, new Blob(["x"], { type: "image/png" }), { upsert: true });
    assert.ok(bobUpload, "Bob must not overwrite Alice's avatar either");
    ok("storage: nobody can write another user's avatar");

    const { error: carolJoin } = await carol.rpc("join_couple", { p_code: code });
    assert.match(carolJoin.message, /couple_full/);
    ok("join_couple rejects a third member");

    const { error: hijack } = await carol.from("couple_members").insert({ couple_id: (await bobApi.from("couples").select("id")).data[0].id, user_id: (await carol.auth.getUser()).data.user.id });
    assert.ok(hijack, "direct insert into couple_members must be blocked");
    const { error: editPartner } = await bobApi.from("profiles").update({ display_name: "Hacked" }).eq("id", aliceId).select();
    const { data: aliceAfter } = await bobApi.from("profiles").select("display_name").eq("id", aliceId).single();
    assert.equal(aliceAfter.display_name, "Alice");
    ok(`writes blocked: direct membership insert (${hijack.code}), partner profile edit (${editPartner ? editPartner.code : "0 rows"})`);

    // ------------------------------------------------------------ Leave team
    step("Bob leaves the team; Alice's old link stops working");
    await page.bob.goto(`${BASE}/partner`);
    page.bob.once("dialog", (d) => d.accept());
    await page.bob.click('button:has-text("Leave team")');
    await page.bob.waitForURL(/\/hub/);
    await page.bob.getByText("Invite partner").waitFor();
    ok("Bob is solo again");

    await page.alice.goto(`${BASE}/hub`);
    await page.alice.getByText("Invite partner").waitFor();
    ok("Alice is solo again");

    await page.carol.goto(inviteLink);
    await page.carol.getByText("This invite link doesn't work").waitFor();
    ok("old invite link is dead (code rotated on leave)");

    await page.alice.goto(`${BASE}/partner`);
    await page.alice.waitForFunction(() =>
      document.querySelector('[data-testid="invite-link"]')?.textContent?.startsWith("http"),
    );
    const newLink = (await page.alice.getByTestId("invite-link").textContent()).trim();
    assert.notEqual(newLink.split("/").pop(), code);
    ok(`Alice has a fresh link: ${newLink}`);
    await shot(page.alice, "11-alice-partner-page-solo");

    console.log("\nALL CHECKS PASSED");
  } catch (err) {
    for (const k of Object.keys(page)) await shot(page[k], `FAIL-${k}`).catch(() => {});
    console.error("\nFAILED:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

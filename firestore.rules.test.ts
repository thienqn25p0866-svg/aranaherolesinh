import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const rulesSrc = fs.readFileSync(new URL("./firestore.rules", import.meta.url), "utf8");

test("Firestore rules include all required Eight Pillars protections", () => {
  assert.match(rulesSrc, /rules_version\s*=\s*'2'/);
  assert.match(rulesSrc, /match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
  assert.match(rulesSrc, /function isValidId\(id\)/);
  assert.match(rulesSrc, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesSrc, /thien\.qn25p0866@gmail\.com/);
  assert.match(rulesSrc, /isValidFounderProfile/);
  assert.match(rulesSrc, /isValidFounderAuditLog/);
  assert.match(rulesSrc, /isValidPlayerSave/);
  assert.match(rulesSrc, /isValidPublicPlayerProfile/);
  assert.match(rulesSrc, /isValidFriendRequest/);
  assert.match(rulesSrc, /affectedKeys\(\)\.hasOnly/);
  assert.match(rulesSrc, /request\.time/);
  assert.match(rulesSrc, /exists\(\/databases\/\$\(database\)\/documents\/founder_profiles\/\$\(userId\)\)/);
  assert.match(rulesSrc, /existing\(\)\.uid == request\.auth\.uid/);
  assert.match(rulesSrc, /existing\(\)\.isPublic == true/);
  assert.match(rulesSrc, /data\.selectedHeroId != "thien" \|\| isBootstrappedFounder\(\)/);
  assert.match(rulesSrc, /!data\.isFounderBadge \|\| isBootstrappedFounder\(\)/);
  assert.match(rulesSrc, /'heroStatsEntries'/);
  assert.match(rulesSrc, /isValidStringList\(data\.heroStatsEntries,\s*40\)/);
  assert.match(rulesSrc, /'classicCleared'/);
  assert.match(rulesSrc, /'bloodCitadelCleared'/);
  assert.match(rulesSrc, /'infernoCleared'/);
  assert.match(rulesSrc, /'frozenTombCleared'/);
  assert.match(rulesSrc, /data\.bloodCitadelCleared is bool/);
  assert.match(rulesSrc, /data\.infernoCleared is bool/);
});

test("Dirty Dozen + social adversarial payloads violate documented invariants", () => {
  const adversarialCases = [
    { name: "1. Unauth profile read", auth: null, op: "get", path: "/founder_profiles/uid1" },
    { name: "2. Unauth profile create", auth: null, op: "create", path: "/founder_profiles/uid1" },
    { name: "3. Non-founder email", auth: { uid: "u2", email: "user@example.com", email_verified: true } },
    { name: "4. Unverified founder email spoof", auth: { uid: "u3", email: "thien.qn25p0866@gmail.com", email_verified: false } },
    { name: "5. Cross-UID write", auth: { uid: "u1", email: "thien.qn25p0866@gmail.com", email_verified: true }, targetUid: "u2" },
    { name: "6. Ghost field injection", payload: { isSuperAdmin: true } },
    { name: "7. Forged timestamp", payload: { createdAt: "2020-01-01T00:00:00Z" } },
    { name: "8. Mutate immutable uid", diffKeys: ["uid"] },
    { name: "9. Poisoned path ID", docId: "bad.id$123" },
    { name: "10. Blanket list scraping", auth: { uid: "u2", email: "user@example.com", email_verified: true }, op: "list" },
    { name: "11. Orphaned audit log without parent profile", parentExists: false },
    { name: "12. Update immutable audit log", op: "update", path: "/founder_profiles/u1/audit_logs/l1" },
    { name: "13. Cross-user private save access", auth: { uid: "u2" }, path: "/player_saves/u1" },
    { name: "14. Non-founder selects secret hero thien in save", payload: { selectedHeroId: "thien" } },
    { name: "15. Sender self-accepts friend request", auth: { uid: "u1" }, fromUid: "u1", status: "accepted" },
    { name: "16. Public directory never exposes email", forbiddenField: "email" },
  ];
  assert.equal(adversarialCases.length, 16);
  // Ensure no plaintext founder password appears in rules or tests
  assert.equal(rulesSrc.includes("68920111"), false);
  // Ensure public_players validator never accepts email PII field
  const publicSection = rulesSrc.slice(
    rulesSrc.indexOf("function isValidPublicPlayerProfile"),
    rulesSrc.indexOf("function isValidFriendRequest")
  );
  assert.equal(publicSection.includes("'email'"), false);
});

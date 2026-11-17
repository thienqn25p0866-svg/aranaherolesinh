# Security Specification — Arena Hero 11.8 (Founder Lock, Player Save & Social Hub)

## 1. Data Invariants
1. **No Client Secret Storage**: The Founder unlock credential is NEVER stored in Firestore documents, client JavaScript, `localStorage`, or `sessionStorage`. Verification happens strictly on the backend (`/api/founder/verify`) using salted `scrypt` verification and/or verified Founder Google Auth (`thien.qn25p0866@gmail.com`).
2. **Founder-Only Profile Isolation**: Only a verified Firebase Auth user whose UID matches `{userId}` AND whose verified email equals `thien.qn25p0866@gmail.com` (`request.auth.token.email_verified == true`) can read or write `/founder_profiles/{userId}` and `/founder_profiles/{userId}/audit_logs/{logId}`.
3. **Private Save Isolation (`/player_saves/{userId}`)**: Only the authenticated, email-verified owner (`request.auth.uid == userId`) can read or write their private cloud progress (`coins`, `highestWave`, `currentWave`, `inventoryItemIds`, `heroGearEntries`, `lifetimeKills`, `matchesPlayed`, `victories`, `dailyCheckInDate`, `unlockedTitles`).
4. **Founder Hero & Badge Lock Across Cloud Sync**: Non-Founder accounts cannot persist `selectedHeroId == "thien"` in `/player_saves/{userId}` nor set `isFounderBadge == true` or `favoriteHeroId == "thien"` in `/public_players/{userId}`.
5. **Strict PII Isolation in Public Directory (`/public_players/{userId}`)**: Public warrior profiles NEVER store emails, phone numbers, or auth tokens. List queries require `existing().isPublic == true`. Writes require email-verified ownership (`request.auth.uid == userId`).
6. **Friend Request State Machine (`/friend_requests/{requestId}`)**:
   - Only the sender (`fromUid == request.auth.uid`, `fromUid != toUid`) can create a `'pending'` request, and only when both `public_players/{fromUid}` and `public_players/{toUid}` exist.
   - Only the recipient (`toUid == request.auth.uid`) can transition `'pending' -> 'accepted' | 'declined'`. Senders cannot self-accept.
   - Only `fromUid` or `toUid` can read (`get`/`list`) or delete (cancel/unfriend) a relationship document.
7. **Immutable Ownership, Timestamps & Bounds**: `uid`, `fromUid`, `toUid`, and `createdAt` are immutable; `createdAt` on `create` and `updatedAt` on `create`/`update` must equal server `request.time`. All lists/strings/maps are explicitly bounded and `hasOnly`-allowlisted.

---

## 2. Adversarial Payloads (Must All Be Rejected with `PERMISSION_DENIED`)

1. **Unauthenticated Profile Read (`GET /founder_profiles/uid_founder`)**: `auth = null`.
2. **Unauthenticated Profile Create (`CREATE /founder_profiles/uid_anon`)**: `auth = null`.
3. **Non-Founder Email Spoof (`CREATE /founder_profiles/uid_other`)**: `auth = { uid: "uid_other", token: { email: "player@example.com", email_verified: true } }`.
4. **Unverified Founder Email Spoof (`CREATE /founder_profiles/uid_spoof`)**: `auth = { uid: "uid_spoof", token: { email: "thien.qn25p0866@gmail.com", email_verified: false } }`.
5. **Cross-UID Identity Poisoning (`CREATE /founder_profiles/uid_other`)**: Verified founder `uid_founder` attempts to write under `/founder_profiles/uid_other` or set `data.uid = "uid_other"`.
6. **Ghost Field / Shadow Privilege Injection (`CREATE /founder_profiles/uid_founder`)**: Includes extra field `{ ..., isSuperAdmin: true }` blocked by `hasOnly`.
7. **Timestamp Forgery (`CREATE /founder_profiles/uid_founder`)**: Supplies client-forged `createdAt` / `updatedAt` instead of `request.time`.
8. **Immutable Field Mutation (`UPDATE /founder_profiles/uid_founder`)**: Attempts to mutate `uid` or `createdAt` or omit `updatedAt == request.time`.
9. **Path ID Poisoning (`CREATE /founder_profiles/uid.bad$id`)**: Document ID fails `^[a-zA-Z0-9_-]+$` or exceeds 128 characters.
10. **Blanket List Query Scraping (`LIST /founder_profiles` & `LIST /player_saves`)**: User attempts to list profiles/saves belonging to another UID.
11. **Orphaned Audit Log Creation (`CREATE /founder_profiles/uid_founder/audit_logs/log1`)**: Parent `/founder_profiles/uid_founder` does not exist yet.
12. **Audit Log Tampering (`UPDATE /founder_profiles/uid_founder/audit_logs/log1`)**: Even the Founder cannot mutate existing immutable audit log entries.
13. **Cross-User Private Save Read/Write (`GET/WRITE /player_saves/uid_victim`)**: Verified player `uid_attacker` reads or overwrites `uid_victim`'s save.
14. **Cloud Sync Hero Privilege Escalation (`CREATE/UPDATE /player_saves/uid_player`)**: Non-Founder sets `selectedHeroId: "thien"` or sets `isFounderBadge: true` in `/public_players/uid_player`.
15. **Self-Accepting Friend Request (`UPDATE /friend_requests/req1`)**: Sender (`fromUid == request.auth.uid`) tries to transition `status` from `'pending'` to `'accepted'`.
16. **Hidden Public Profile Scraping (`LIST /public_players`)**: Listing `/public_players` where `isPublic == false` fails rule gate.

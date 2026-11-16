# Security Specification — Arena Hero 11.8 (Founder Access & Audit)

## 1. Data Invariants
1. **No Client Secret Storage**: The Founder unlock credential is NEVER stored in Firestore documents, client JavaScript, `localStorage`, or `sessionStorage`. Verification happens strictly on the backend (`/api/founder/verify`) using salted `scrypt` verification and/or verified Founder Google Auth (`thien.qn25p0866@gmail.com`).
2. **Founder-Only Profile Isolation**: Only a verified Firebase Auth user whose UID matches `{userId}` AND whose verified email equals `thien.qn25p0866@gmail.com` (`request.auth.token.email_verified == true`) can read or write `/founder_profiles/{userId}`.
3. **Immutable Ownership & Timestamps**: `uid` and `createdAt` are immutable after creation; `createdAt` on `create` and `updatedAt` on `update` must equal server `request.time`.
4. **Master Gate Subcollection Sync**: Writes and reads under `/founder_profiles/{userId}/audit_logs/{logId}` require the parent `/founder_profiles/{userId}` document to exist and belong to the verified Founder.
5. **Audit Immutability**: Once written, `audit_logs` entries cannot be modified (`allow update: if false;`). Only the verified Founder owner may read or prune their own audit logs.
6. **Strict Schema & Bounds**: Every string (`uid`, `displayName`, `eventType`, `heroId`, `source`), number, boolean, and ID path variable (`^[a-zA-Z0-9_-]+$`, `<= 128` chars) is strictly bounded and `hasOnly`-allowlisted. No ghost fields are permitted.

---

## 2. The "Dirty Dozen" Payloads (Must All Be Rejected with `PERMISSION_DENIED`)

1. **Unauthenticated Profile Read (`GET /founder_profiles/uid_founder`)**: `auth = null`.
2. **Unauthenticated Profile Create (`CREATE /founder_profiles/uid_anon`)**: `auth = null`.
3. **Non-Founder Email Spoof (`CREATE /founder_profiles/uid_other`)**: `auth = { uid: "uid_other", token: { email: "player@example.com", email_verified: true } }`.
4. **Unverified Founder Email Spoof (`CREATE /founder_profiles/uid_spoof`)**: `auth = { uid: "uid_spoof", token: { email: "thien.qn25p0866@gmail.com", email_verified: false } }`.
5. **Cross-UID Identity Poisoning (`CREATE /founder_profiles/uid_other`)**: Verified founder `uid_founder` attempts to write under `/founder_profiles/uid_other` or set `data.uid = "uid_other"`.
6. **Ghost Field / Shadow Privilege Injection (`CREATE /founder_profiles/uid_founder`)**: Includes extra field `{ ..., isSuperAdmin: true }` blocked by `hasOnly`.
7. **Timestamp Forgery (`CREATE /founder_profiles/uid_founder`)**: Supplies client-forged `createdAt` / `updatedAt` instead of `request.time`.
8. **Immutable Field Mutation (`UPDATE /founder_profiles/uid_founder`)**: Attempts to mutate `uid` or `createdAt` or omit `updatedAt == request.time`.
9. **Path ID Poisoning (`CREATE /founder_profiles/uid.bad$id`)**: Document ID fails `^[a-zA-Z0-9_-]+$` or exceeds 128 characters.
10. **Blanket List Query Scraping (`LIST /founder_profiles`)**: Non-founder signed-in user attempts to list `founder_profiles` without matching `resource.data.uid == request.auth.uid` & founder identity.
11. **Orphaned Audit Log Creation (`CREATE /founder_profiles/uid_founder/audit_logs/log1`)**: Parent `/founder_profiles/uid_founder` does not exist yet (Master Gate `exists()` check fails).
12. **Audit Log Tampering (`UPDATE /founder_profiles/uid_founder/audit_logs/log1`)**: Even the Founder cannot mutate existing immutable audit log entries, nor inject oversized `heroId`/`eventType` strings.

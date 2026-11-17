# Security Specification — TEMAN TPT (UPTD Puskesmas Pauh)

## 1. Data Invariants
1. **Default-Deny & Active Staff Gate**: Every read and write requires `request.auth != null`, `request.auth.token.email_verified == true`, and an active user document at `/users/{uid}` where `isActive == true` and `role in ['super_admin', 'admin_puskesmas', 'petugas_tb', 'nakes']`.
2. **RBAC Enforcement on Clinical Decisions**: Only `nakes` or `super_admin` may modify TPT clinical decision fields (`keputusanTenagaKesehatan`, `catatanKeputusanNakes`, `nakesPenentu`, `memenuhiKriteriaTPT`, `alasanKelayakanTPT`) on `closeContacts`.
3. **Immutable Audit Trail (`activityLogs`)**: `activityLogs` is strictly append-only (`allow update, delete: if false;`), and `createdByUid` must equal `request.auth.uid` with `createdAt == request.time`.
4. **PII Isolation (`users`)**: Staff PII (`email`, `phone`, `nip`) in `/users/{userId}` can only be read by the document owner (`request.auth.uid == userId`) or active admins (`super_admin`, `admin_puskesmas`). Non-admins cannot `list` `/users`.
5. **No Self-Escalation of Roles**: Users cannot elevate their own `role` or `isActive` on `/users/{uid}`. Only `super_admin` can assign roles or toggle `isActive` (except initial bootstrap creation of the designated `super_admin` email `tpt.puskesmaspauh@gmail.com`).
6. **Temporal Integrity & Path Guard**: Every path ID matches `^[a-zA-Z0-9_\-]+$` (<= 128 chars), every string has explicit `.size()` bounds, `createdAt == request.time` on create, `updatedAt == request.time` and `createdAt == existing().createdAt` on update.

## 2. The "Dirty Dozen" Attack Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Patient Read**: `get /indexPatients/TB-PAUH-2026-001` with `auth: null`.
2. **Inactive Staff Write**: `create /indexPatients/TB-PAUH-2026-099` with `users/{uid}.isActive == false`.
3. **Unverified Email Spoof**: `create /indexPatients/TB-PAUH-2026-099` with `email: "tpt.puskesmaspauh@gmail.com"` and `email_verified: false`.
4. **Self-Role Escalation on User Update**: `petugas_tb` updates `/users/{ownUid}` changing `role` to `"super_admin"`.
5. **Non-Admin Listing Staff PII**: `petugas_tb` attempts `list /users` to scrape staff emails/phones/NIPs.
6. **Non-Nakes Writing TPT Medical Decision**: `petugas_tb` updates `/closeContacts/KE-PAUH-2026-001` with `keputusanTenagaKesehatan: "Layak Diberikan TPT"`.
7. **Shadow / Ghost Field Injection**: Staff creates `/indexPatients/TB-PAUH-2026-099` containing unknown ghost field `isAdminBypass: true`.
8. **Oversized ID Poisoning**: Staff accesses `/indexPatients/<200-char-invalid-id!@#>` violating `isValidId()`.
9. **Client-Spoofed Timestamp**: Staff creates `/closeContacts/KE-PAUH-2026-099` with backdated client string/timestamp instead of `request.time`.
10. **Audit Log Tampering / Deletion**: Even `super_admin` attempts `update` or `delete` on `/activityLogs/LOG-001`.
11. **Identity Spoofing on Audit Log**: `petugas_tb` creates `/activityLogs/LOG-999` with `createdByUid: "another_uid"`.
12. **Blanket Unscoped List Query**: Staff attempts `list /indexPatients` without filtering `faskesCode == 'P137107'`.

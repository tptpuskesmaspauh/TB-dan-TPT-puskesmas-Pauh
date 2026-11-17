/**
 * Phase 0: Security Rules Verification Specification (Dirty Dozen Test Matrix)
 * Compatible with @firebase/rules-unit-testing when run against Firebase Emulator.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  actor: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Patient Read',
    actor: 'unauthenticated',
    operation: 'get',
    path: '/indexPatients/TB-PAUH-2026-001',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Inactive Staff Write',
    actor: 'inactive_staff_uid',
    operation: 'create',
    path: '/indexPatients/TB-PAUH-2026-099',
    payload: { id: 'TB-PAUH-2026-099', faskesCode: 'P137107', namaLengkap: 'Test' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Unverified Email Spoof',
    actor: 'unverified_admin_email',
    operation: 'create',
    path: '/indexPatients/TB-PAUH-2026-099',
    payload: { id: 'TB-PAUH-2026-099', faskesCode: 'P137107', namaLengkap: 'Test' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Self-Role Escalation on User Update',
    actor: 'petugas_tb_uid',
    operation: 'update',
    path: '/users/petugas_tb_uid',
    payload: { role: 'super_admin' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Non-Admin Listing Staff PII',
    actor: 'petugas_tb_uid',
    operation: 'list',
    path: '/users',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Non-Nakes Writing TPT Medical Decision',
    actor: 'petugas_tb_uid',
    operation: 'update',
    path: '/closeContacts/KE-PAUH-2026-001',
    payload: {
      keputusanTenagaKesehatan: 'Layak Diberikan TPT',
      memenuhiKriteriaTPT: true
    },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Shadow / Ghost Field Injection',
    actor: 'petugas_tb_uid',
    operation: 'create',
    path: '/indexPatients/TB-PAUH-2026-099',
    payload: { id: 'TB-PAUH-2026-099', faskesCode: 'P137107', isAdminBypass: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Oversized / Invalid Path ID Poisoning',
    actor: 'petugas_tb_uid',
    operation: 'get',
    path: `/indexPatients/${'x'.repeat(200)}!@#`,
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Client-Spoofed Backdated Timestamp',
    actor: 'petugas_tb_uid',
    operation: 'create',
    path: '/closeContacts/KE-PAUH-2026-099',
    payload: { id: 'KE-PAUH-2026-099', faskesCode: 'P137107', createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Audit Log Tampering / Deletion by Super Admin',
    actor: 'super_admin_uid',
    operation: 'delete',
    path: '/activityLogs/LOG-001',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Identity Spoofing on Audit Log Creation',
    actor: 'petugas_tb_uid',
    operation: 'create',
    path: '/activityLogs/LOG-999',
    payload: { id: 'LOG-999', faskesCode: 'P137107', createdByUid: 'other_uid' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Unscoped List Query Without Faskes Boundary',
    actor: 'petugas_tb_uid',
    operation: 'list',
    path: '/indexPatients',
    expected: 'PERMISSION_DENIED'
  }
];
